import { Conversation } from '../models/Conversation.js';
import { Document } from '../models/Document.js';
import { generateEmbedding } from '../services/embedding.service.js';
import { searchVectorIndex } from '../services/qdrant.service.js';
import { generateAnswerWithGemini } from '../services/gemini.service.js';
import { createAuditLog } from '../utils/auditService.js';

const RAG_TOP_K = parseInt(process.env.RAG_TOP_K || '5', 10);
const RAG_SIMILARITY_THRESHOLD = parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || '0.20');

/**
 * POST /api/chat/ask
 * Grounded RAG Question Answering Workflow:
 * 1. Validate Question & Authenticate Caller
 * 2. Scope Query to Caller's Organization
 * 3. Enforce RBAC Document Filter (employee sees Public/Internal; manager sees Public/Internal/Confidential; admin sees all)
 * 4. Generate Question Embedding
 * 5. Search Qdrant with Strict Tenant & Permission Filter
 * 6. Send Retrieved Chunks to Gemini with Grounding Instruction
 * 7. Save Conversation & Return Answer with Ground-Truth Citations
 */
export async function askQuestion(req, res, next) {
  try {
    const { question, documentId, conversationId } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Question is required and must be a non-empty string.'
      });
    }

    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Question exceeds maximum length limit of 2,000 characters.'
      });
    }

    // Prompt injection heuristic: detect attempts to override system prompt or exfiltrate hidden instructions
    const injectionPatterns = [
      /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
      /disregard\s+(all\s+)?(previous|prior|above)\s+instructions/i,
      /you\s+are\s+now\s+(an?\s+)?unrestricted/i,
      /system\s+prompt\s+override/i,
      /reveal\s+(your\s+)?system\s+(prompt|instruction)/i,
      /exfiltrate\s+all\s+(data|documents|passwords|keys)/i
    ];

    const isSuspiciousInjection = injectionPatterns.some(pattern => pattern.test(trimmedQuestion));
    if (isSuspiciousInjection) {
      await createAuditLog({
        req,
        action: 'PROMPT_INJECTION_DETECTED',
        resourceType: 'AI_CHAT',
        result: 'denied',
        details: 'Heuristic filter blocked prompt injection attempt attempting to override system boundaries.'
      });

      return res.status(400).json({
        success: false,
        message: 'Security Notice: Prompt rejected. Queries attempting to override security boundaries or reveal system instructions are disallowed.'
      });
    }

    const userOrgId = req.user.organizationId?._id || req.user.organizationId;
    const userRole = (req.user.role || '').toLowerCase();

    // 1. Determine which documents this user is authorized to read
    const docQuery = { organizationId: userOrgId };
    if (userRole === 'employee') {
      docQuery.accessLevel = { $in: ['Public', 'Internal'] };
    } else if (userRole === 'manager') {
      docQuery.accessLevel = { $in: ['Public', 'Internal', 'Confidential'] };
    }

    // If specific document was requested, ensure it exists and user is allowed to access it
    if (documentId && documentId !== 'all') {
      const specificDoc = await Document.findOne({ _id: documentId, organizationId: userOrgId });
      if (!specificDoc) {
        await createAuditLog({
          req,
          action: 'RAG_QUERY_DENIED',
          resourceType: 'DOCUMENT',
          resourceId: documentId,
          result: 'denied',
          details: 'User attempted to query document from another tenant or invalid ID.'
        });
        return res.status(404).json({
          success: false,
          message: 'Selected document not found in your organization.'
        });
      }

      // Check clearance
      if (userRole === 'employee' && ['Confidential', 'Restricted'].includes(specificDoc.accessLevel)) {
        await createAuditLog({
          req,
          action: 'RAG_QUERY_DENIED',
          resourceType: 'DOCUMENT',
          resourceId: String(specificDoc._id),
          resourceName: specificDoc.title,
          result: 'denied',
          details: `Employee attempted to query ${specificDoc.accessLevel} document without clearance.`
        });
        return res.status(403).json({
          success: false,
          message: `Access Denied: You do not possess clearance to query '${specificDoc.accessLevel}' documents.`
        });
      }

      if (userRole === 'manager' && specificDoc.accessLevel === 'Restricted') {
        await createAuditLog({
          req,
          action: 'RAG_QUERY_DENIED',
          resourceType: 'DOCUMENT',
          resourceId: String(specificDoc._id),
          resourceName: specificDoc.title,
          result: 'denied',
          details: 'Manager attempted to query Restricted document.'
        });
        return res.status(403).json({
          success: false,
          message: "Access Denied: 'Restricted' documents are reserved exclusively for Administrators."
        });
      }

      docQuery._id = specificDoc._id;
    }

    // Fetch authorized document IDs
    const authorizedDocs = await Document.find(docQuery, '_id title originalFileName accessLevel');
    const authorizedDocIds = authorizedDocs.map(d => String(d._id));
    const docMap = new Map();
    authorizedDocs.forEach(d => docMap.set(String(d._id), d));

    if (authorizedDocIds.length === 0) {
      return res.json({
        success: true,
        data: {
          answer: "No authorized documents are available in your organization's repository to answer this question.",
          citations: [],
          model: 'securerag-router'
        }
      });
    }

    // 2. Generate Question Embedding
    const questionEmbedding = await generateEmbedding(trimmedQuestion);

    // 3. Vector Search in Qdrant with Strict Tenant & Permission Filter
    const vectorFilter = {
      organizationId: String(userOrgId),
      documentIds: authorizedDocIds
    };
    if (documentId && documentId !== 'all') {
      vectorFilter.documentId = String(documentId);
    }

    const searchResults = await searchVectorIndex(
      questionEmbedding.embedding,
      vectorFilter,
      RAG_TOP_K,
      RAG_SIMILARITY_THRESHOLD
    );

    // 4. Double check retrieved chunks against database permissions before building prompt context
    const contextChunks = [];
    const citations = [];

    for (const match of searchResults) {
      const payload = match.payload || {};
      const doc = docMap.get(String(payload.documentId));

      // Security check: must exist in authorized list
      if (!doc) continue;

      const chunkText = payload.text || '';
      const pageNum = payload.page || 1;
      const score = Math.round((match.score || 0.85) * 100);

      contextChunks.push({
        text: chunkText,
        page: pageNum,
        documentId: String(doc._id),
        docName: doc.title || doc.originalFileName
      });

      citations.push({
        documentId: doc._id,
        docName: doc.title || doc.originalFileName,
        page: pageNum,
        chunkId: payload.chunkId || `p${pageNum}_c${payload.chunkIndex || 0}`,
        excerpt: chunkText.length > 250 ? chunkText.substring(0, 250) + '...' : chunkText,
        matchScore: `${score}%`
      });
    }

    // 5. Generate Grounded Answer with Gemini
    const { answer, model } = await generateAnswerWithGemini(trimmedQuestion, contextChunks);

    // If answer indicates no direct evidence or insufficient evidence, prune citations
    const finalCitations = answer.toLowerCase().includes('no direct evidence') ||
      answer.toLowerCase().includes('could not find') ||
      answer.toLowerCase().includes('insufficient evidence')
      ? []
      : citations;

    // 6. Persist Conversation & Messages
    let conv;
    if (conversationId) {
      conv = await Conversation.findOne({
        _id: conversationId,
        organizationId: userOrgId,
        userId: req.user._id
      });
    }

    if (!conv) {
      conv = new Conversation({
        organizationId: userOrgId,
        userId: req.user._id,
        title: trimmedQuestion.length > 40 ? trimmedQuestion.substring(0, 40) + '...' : trimmedQuestion,
        messages: []
      });
    }

    // Push User message
    conv.messages.push({
      sender: 'user',
      text: trimmedQuestion,
      citations: [],
      createdAt: new Date()
    });

    // Push Assistant message
    const assistantMsg = {
      sender: 'assistant',
      text: answer,
      citations: finalCitations,
      isDenied: false,
      createdAt: new Date()
    };
    conv.messages.push(assistantMsg);

    await conv.save();

    // 7. Tamper-Proof Audit Log (without logging sensitive question or document text)
    await createAuditLog({
      req,
      action: 'RAG_QUERY',
      resourceType: 'AI_CHAT',
      resourceId: String(conv._id),
      result: 'allowed',
      details: `Generated RAG response using ${finalCitations.length} verified passages from ${authorizedDocs.length} accessible documents.`
    });

    res.json({
      success: true,
      data: {
        conversationId: conv._id,
        messageId: conv.messages[conv.messages.length - 1]._id,
        answer: answer,
        citations: finalCitations,
        model: model,
        retrievedCount: finalCitations.length
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/chat/conversations
 * Lists user's active conversations
 */
export async function getConversations(req, res, next) {
  try {
    const userOrgId = req.user.organizationId?._id || req.user.organizationId;
    const conversations = await Conversation.find({
      organizationId: userOrgId,
      userId: req.user._id
    })
      .sort({ updatedAt: -1 })
      .limit(30);

    const formatted = conversations.map(c => ({
      id: c._id,
      title: c.title,
      messageCount: c.messages.length,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));

    res.json({
      success: true,
      data: formatted
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/chat/conversations/:id
 * Retrieves full conversation message history
 */
export async function getConversationById(req, res, next) {
  try {
    const { id } = req.params;
    const userOrgId = req.user.organizationId?._id || req.user.organizationId;

    const conv = await Conversation.findOne({
      _id: id,
      organizationId: userOrgId,
      userId: req.user._id
    });

    if (!conv) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or access unauthorized.'
      });
    }

    res.json({
      success: true,
      data: {
        id: conv._id,
        title: conv.title,
        messages: conv.messages,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/chat/conversations/:id
 * Deletes user conversation
 */
export async function deleteConversation(req, res, next) {
  try {
    const { id } = req.params;
    const userOrgId = req.user.organizationId?._id || req.user.organizationId;

    const deleted = await Conversation.findOneAndDelete({
      _id: id,
      organizationId: userOrgId,
      userId: req.user._id
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or unauthorized.'
      });
    }

    res.json({
      success: true,
      message: 'Conversation deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}
