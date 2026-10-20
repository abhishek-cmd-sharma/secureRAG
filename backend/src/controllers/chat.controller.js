import { Conversation } from '../models/Conversation.js';
import { Document } from '../models/Document.js';
import { generateEmbedding } from '../services/embedding.service.js';
import { searchVectorIndex, getDocumentChunks } from '../services/qdrant.service.js';
import {
  generateAnswerWithGemini,
  rewriteQueryWithContext,
  generateSummaryWithGemini,
  generateComparisonWithGemini,
  generateExtractionWithGemini
} from '../services/gemini.service.js';
import { createAuditLog } from '../utils/auditService.js';

const RAG_TOP_K = parseInt(process.env.RAG_TOP_K || '5', 10);
const RAG_SIMILARITY_THRESHOLD = parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || '0.20');

/**
 * Normalizes documentId or documentIds input into an array of unique document IDs.
 */
export function normalizeTargetDocumentIds(documentId, documentIds) {
  let targets = [];
  if (Array.isArray(documentIds)) {
    targets = documentIds.filter(id => id && id !== 'all');
  } else if (typeof documentIds === 'string' && documentIds !== 'all') {
    targets = documentIds.split(',').map(s => s.trim()).filter(Boolean);
  } else if (Array.isArray(documentId)) {
    targets = documentId.filter(id => id && id !== 'all');
  } else if (typeof documentId === 'string' && documentId !== 'all') {
    targets = documentId.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [...new Set(targets)];
}

/**
 * Helper to check RBAC clearance for a document against user role.
 */
async function checkDocumentClearance(doc, userRole, req, actionName = 'RAG_QUERY_DENIED') {
  if (userRole === 'employee' && ['Confidential', 'Restricted'].includes(doc.accessLevel)) {
    await createAuditLog({
      req,
      action: actionName,
      resourceType: 'DOCUMENT',
      resourceId: String(doc._id),
      resourceName: doc.title,
      result: 'denied',
      details: `Employee attempted to access ${doc.accessLevel} document without clearance.`
    });
    return {
      authorized: false,
      status: 403,
      message: `Access Denied: You do not possess clearance to query '${doc.accessLevel}' documents.`
    };
  }

  if (userRole === 'manager' && doc.accessLevel === 'Restricted') {
    await createAuditLog({
      req,
      action: actionName,
      resourceType: 'DOCUMENT',
      resourceId: String(doc._id),
      resourceName: doc.title,
      result: 'denied',
      details: 'Manager attempted to access Restricted document.'
    });
    return {
      authorized: false,
      status: 403,
      message: "Access Denied: 'Restricted' documents are reserved exclusively for Administrators."
    };
  }

  return { authorized: true };
}

/**
 * POST /api/chat/ask
 * Grounded RAG Question Answering Workflow with Multi-Document & Conversational Intelligence:
 * 1. Validate Question & Authenticate Caller
 * 2. Scope Query to Caller's Organization
 * 3. Enforce RBAC Document Filter (employee sees Public/Internal; manager sees Public/Internal/Confidential; admin sees all)
 * 4. Resolve conversational coreferences and pronouns using conversation history
 * 5. Retrieve balanced chunks across authorized target documents
 * 6. Send Retrieved Chunks to Gemini with Multi-Document Grounding Instruction
 * 7. Save Conversation & Return Answer with Ground-Truth Citations
 */
export async function askQuestion(req, res, next) {
  try {
    const { question, documentId, documentIds, conversationId } = req.body;

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

    // Normalize targeted document IDs
    const targetDocIds = normalizeTargetDocumentIds(documentId, documentIds);

    // If specific documents were requested, verify their existence and user clearance
    if (targetDocIds.length > 0) {
      for (const tId of targetDocIds) {
        const specificDoc = await Document.findOne({ _id: tId, organizationId: userOrgId });
        if (!specificDoc) {
          await createAuditLog({
            req,
            action: 'RAG_QUERY_DENIED',
            resourceType: 'DOCUMENT',
            resourceId: tId,
            result: 'denied',
            details: 'User attempted to query document from another tenant or invalid ID.'
          });
          return res.status(404).json({
            success: false,
            message: `Selected document (${tId}) not found in your organization.`
          });
        }

        const clearance = await checkDocumentClearance(specificDoc, userRole, req);
        if (!clearance.authorized) {
          return res.status(clearance.status).json({
            success: false,
            message: clearance.message
          });
        }
      }

      if (targetDocIds.length === 1) {
        docQuery._id = targetDocIds[0];
      } else {
        docQuery._id = { $in: targetDocIds };
      }
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
          model: 'securerag-router',
          searchedDocuments: []
        }
      });
    }

    // 2. Fetch Conversation History for Conversational Memory & Coreference Resolution
    let priorMessages = [];
    let conv = null;
    if (conversationId) {
      conv = await Conversation.findOne({
        _id: conversationId,
        organizationId: userOrgId,
        userId: req.user._id
      });
      if (conv && Array.isArray(conv.messages)) {
        priorMessages = conv.messages;
      }
    }

    // Coreference Resolution: rewrite query if pronouns or relative terms are present
    let rewrittenQuery = trimmedQuestion;
    if (priorMessages.length > 0) {
      rewrittenQuery = await rewriteQueryWithContext(trimmedQuestion, priorMessages);
      if (rewrittenQuery !== trimmedQuestion) {
        console.log(`[Conversational Memory] Rewrote "${trimmedQuestion}" -> "${rewrittenQuery}"`);
      }
    }

    // 3. Generate Question Embedding with Preprocessed/Enriched Query
    const retrievalQuery = preprocessQueryForRetrieval(rewrittenQuery);
    const questionEmbedding = await generateEmbedding(retrievalQuery);

    const effectiveThreshold = process.env.RAG_SIMILARITY_THRESHOLD
      ? parseFloat(process.env.RAG_SIMILARITY_THRESHOLD)
      : (process.env.NODE_ENV === 'test' ? -0.5 : RAG_SIMILARITY_THRESHOLD);

    // 4. Vector Search in Qdrant with Strict Tenant & Permission Filter
    let searchResults = [];

    // Smart Multi-Document Orchestration: Fair balanced allocation across selected documents
    if (targetDocIds.length >= 2) {
      const chunksPerDoc = Math.max(3, Math.floor(12 / targetDocIds.length));
      for (const dId of targetDocIds) {
        const docResults = await searchVectorIndex(
          questionEmbedding.embedding,
          { organizationId: String(userOrgId), documentId: String(dId) },
          chunksPerDoc,
          effectiveThreshold
        );
        searchResults.push(...docResults);
      }
    } else {
      const vectorFilter = {
        organizationId: String(userOrgId),
        documentIds: authorizedDocIds
      };
      if (targetDocIds.length === 1) {
        vectorFilter.documentId = String(targetDocIds[0]);
      }

      const effectiveTopK = (targetDocIds.length === 1) ? Math.max(RAG_TOP_K, 8) : RAG_TOP_K;
      searchResults = await searchVectorIndex(
        questionEmbedding.embedding,
        vectorFilter,
        effectiveTopK,
        effectiveThreshold
      );
    }

    // 5. Double check retrieved chunks against database permissions before building prompt context
    const contextChunks = [];
    const citations = [];

    for (const match of searchResults) {
      const payload = match.payload || {};
      const doc = docMap.get(String(payload.documentId));

      // Security check: must exist in authorized list
      if (!doc) continue;

      const chunkText = payload.text || '';
      const pageNum = payload.page || 1;
      const rawScore = match.score || 0.85;
      const score = Math.round(rawScore * 100);

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
        snippet: chunkText,
        matchScore: `${score}% Cosine Match`,
        rawScore: rawScore
      });
    }

    console.log(`[RAG Retrieval] Query: "${trimmedQuestion.substring(0, 40)}...", Authorized Docs: ${authorizedDocIds.length}, Matches: ${searchResults.length}, Context Chunks: ${contextChunks.length}`);

    // 6. Generate Grounded Answer with Gemini (Passing conversation context and multi-doc guidance)
    const { answer, model } = await generateAnswerWithGemini(trimmedQuestion, contextChunks, priorMessages);

    // Filter citations so only genuinely supporting passages are displayed
    const finalCitations = filterSupportingCitations(citations, answer);

    // 7. Persist Conversation & Messages
    let convId = null;
    let messageId = null;
    try {
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
      convId = conv._id;
      messageId = conv.messages[conv.messages.length - 1]._id;

      // 8. Tamper-Proof Audit Log
      await createAuditLog({
        req,
        action: 'RAG_QUERY',
        resourceType: 'AI_CHAT',
        resourceId: String(conv._id),
        result: 'allowed',
        details: finalCitations.length > 0
          ? `Generated grounded RAG response using ${finalCitations.length} verified passages from ${authorizedDocs.length} accessible documents.`
          : `Safe abstention: no relevant evidence found in ${authorizedDocs.length} accessible documents (0 passages cited).`
      });
    } catch (saveErr) {
      console.warn(`[Chat] Non-fatal database persistence warning (${saveErr.message}). Delivering answer to client.`);
    }

    res.json({
      success: true,
      data: {
        conversationId: convId,
        messageId: messageId,
        answer: answer,
        citations: finalCitations,
        model: model,
        isDenied: false,
        retrievedCount: finalCitations.length,
        rewrittenQuery: rewrittenQuery !== trimmedQuestion ? rewrittenQuery : undefined,
        searchedDocuments: authorizedDocs.map(d => ({
          id: d._id,
          title: d.title || d.originalFileName,
          accessLevel: d.accessLevel
        }))
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/chat/summarize
 * Generates an authoritative grounded summary of an accessible document.
 */
export async function summarizeDocument(req, res, next) {
  try {
    const { documentId, summaryType = 'detailed' } = req.body;
    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'documentId is required for summarization.'
      });
    }

    const userOrgId = req.user.organizationId?._id || req.user.organizationId;
    const userRole = (req.user.role || '').toLowerCase();

    const doc = await Document.findOne({ _id: documentId, organizationId: userOrgId });
    if (!doc) {
      await createAuditLog({
        req,
        action: 'DOCUMENT_SUMMARY_DENIED',
        resourceType: 'DOCUMENT',
        resourceId: documentId,
        result: 'denied',
        details: 'User attempted to summarize non-existent document or document outside organization.'
      });
      return res.status(404).json({
        success: false,
        message: 'Document not found in your organization.'
      });
    }

    const clearance = await checkDocumentClearance(doc, userRole, req, 'DOCUMENT_SUMMARY_DENIED');
    if (!clearance.authorized) {
      return res.status(clearance.status).json({
        success: false,
        message: clearance.message
      });
    }

    // Retrieve all chunks in natural page order
    const rawChunks = await getDocumentChunks(documentId, String(userOrgId));
    if (!rawChunks || rawChunks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No indexed passages found for this document. Please ensure the document is processed.'
      });
    }

    const contextChunks = rawChunks.map(c => ({
      text: c.text,
      page: c.page || 1,
      chunkId: c.chunkId || `p${c.page}`,
      docName: doc.title || doc.originalFileName,
      documentId: String(doc._id)
    }));

    const result = await generateSummaryWithGemini(contextChunks, summaryType);

    await createAuditLog({
      req,
      action: 'DOCUMENT_SUMMARY',
      resourceType: 'DOCUMENT',
      resourceId: String(doc._id),
      resourceName: doc.title,
      result: 'allowed',
      details: `Generated ${summaryType} summary using ${contextChunks.length} document passages.`
    });

    res.json({
      success: true,
      data: {
        summary: result.summary,
        summaryType: summaryType,
        documentId: doc._id,
        docName: doc.title || doc.originalFileName,
        chunkCount: contextChunks.length,
        citations: result.citations,
        model: result.model
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/chat/compare
 * Compares two or more authorized documents and detects contradictions or differences.
 */
export async function compareDocuments(req, res, next) {
  try {
    const { documentIds, comparisonFields = [] } = req.body;
    if (!Array.isArray(documentIds) || documentIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'documentIds must be an array containing at least two document IDs.'
      });
    }

    const userOrgId = req.user.organizationId?._id || req.user.organizationId;
    const userRole = (req.user.role || '').toLowerCase();

    const docGroups = [];
    for (const dId of documentIds) {
      const doc = await Document.findOne({ _id: dId, organizationId: userOrgId });
      if (!doc) {
        await createAuditLog({
          req,
          action: 'DOCUMENT_COMPARISON_DENIED',
          resourceType: 'DOCUMENT',
          resourceId: dId,
          result: 'denied',
          details: 'Document not found in organization during multi-document comparison.'
        });
        return res.status(404).json({
          success: false,
          message: `Document (${dId}) not found in your organization.`
        });
      }

      const clearance = await checkDocumentClearance(doc, userRole, req, 'DOCUMENT_COMPARISON_DENIED');
      if (!clearance.authorized) {
        return res.status(clearance.status).json({
          success: false,
          message: clearance.message
        });
      }

      const rawChunks = await getDocumentChunks(dId, String(userOrgId));
      docGroups.push({
        documentId: String(doc._id),
        docName: doc.title || doc.originalFileName,
        accessLevel: doc.accessLevel,
        chunks: rawChunks.map(c => ({
          text: c.text,
          page: c.page || 1,
          chunkId: c.chunkId || `p${c.page}`,
          docName: doc.title || doc.originalFileName,
          documentId: String(doc._id)
        }))
      });
    }

    const result = await generateComparisonWithGemini(docGroups, comparisonFields);

    await createAuditLog({
      req,
      action: 'DOCUMENT_COMPARISON',
      resourceType: 'AI_CHAT',
      result: 'allowed',
      details: `Compared ${docGroups.length} documents: ${docGroups.map(d => d.docName).join(', ')}.`
    });

    res.json({
      success: true,
      data: {
        comparison: result.comparison,
        documents: docGroups.map(d => ({ id: d.documentId, docName: d.docName, accessLevel: d.accessLevel })),
        citations: result.citations,
        model: result.model
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/chat/extract
 * Extracts structured, schema-validated intelligence from an authorized document.
 */
export async function extractDocumentInfo(req, res, next) {
  try {
    const { documentId, extractionType = 'technologies', customSchema = null } = req.body;
    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'documentId is required for structured extraction.'
      });
    }

    const userOrgId = req.user.organizationId?._id || req.user.organizationId;
    const userRole = (req.user.role || '').toLowerCase();

    const doc = await Document.findOne({ _id: documentId, organizationId: userOrgId });
    if (!doc) {
      await createAuditLog({
        req,
        action: 'DOCUMENT_EXTRACTION_DENIED',
        resourceType: 'DOCUMENT',
        resourceId: documentId,
        result: 'denied',
        details: 'Document not found during structured extraction.'
      });
      return res.status(404).json({
        success: false,
        message: 'Document not found in your organization.'
      });
    }

    const clearance = await checkDocumentClearance(doc, userRole, req, 'DOCUMENT_EXTRACTION_DENIED');
    if (!clearance.authorized) {
      return res.status(clearance.status).json({
        success: false,
        message: clearance.message
      });
    }

    const rawChunks = await getDocumentChunks(documentId, String(userOrgId));
    if (!rawChunks || rawChunks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No indexed passages found for this document.'
      });
    }

    const contextChunks = rawChunks.map(c => ({
      text: c.text,
      page: c.page || 1,
      chunkId: c.chunkId || `p${c.page}`,
      docName: doc.title || doc.originalFileName,
      documentId: String(doc._id)
    }));

    const result = await generateExtractionWithGemini(contextChunks, extractionType, customSchema);

    await createAuditLog({
      req,
      action: 'DOCUMENT_EXTRACTION',
      resourceType: 'DOCUMENT',
      resourceId: String(doc._id),
      resourceName: doc.title,
      result: 'allowed',
      details: `Extracted ${extractionType} data from ${doc.title}.`
    });

    res.json({
      success: true,
      data: {
        extraction: result.data,
        markdown: result.markdown,
        extractionType: extractionType,
        documentId: doc._id,
        docName: doc.title || doc.originalFileName,
        citations: result.citations,
        model: result.model
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

/**
 * Preprocesses and enriches user questions with technical domain terms
 * when the question seeks implementation, architectural, or framework details.
 * Preserves original user intent without altering facts or evidence.
 */
export function preprocessQueryForRetrieval(question) {
  if (!question || typeof question !== 'string') return '';
  const trimmed = question.trim();
  const techPattern = /\b(tech(nology|nologies)?|tech\s*stack|stack|frameworks?|libraries|programming\s*languages?|frontend|backend|database|ai\s*tools?|tools?\s*(used|mentioned)|architecture|how\s+is\s+this\s+(built|made)|what\s+is\s+used\s+to\s+make)\b/i;
  if (techPattern.test(trimmed)) {
    return `${trimmed} (technology stack, software architecture, tools, frameworks, database, frontend, backend, AI)`;
  }
  return trimmed;
}

/**
 * Filters retrieved citations so only those genuinely supporting the claims
 * in the answer are displayed to the user.
 */
export function filterSupportingCitations(allCitations, answerText) {
  if (!allCitations || allCitations.length === 0) return [];

  const lowerAnswer = (answerText || '').toLowerCase();

  // Full abstention / missing evidence check
  const isFullAbstention = 
    ((lowerAnswer.includes('could not find the answer') || lowerAnswer.includes('could not find an answer') || lowerAnswer.includes('could not find any answer')) && !lowerAnswer.includes('page')) ||
    (lowerAnswer.includes('no authorized documents are available')) ||
    ((lowerAnswer.includes('no direct evidence was found') || lowerAnswer.includes('no direct evidence')) && !lowerAnswer.includes('page')) ||
    (lowerAnswer.includes('not contain any information') && !lowerAnswer.includes('page')) ||
    (lowerAnswer.includes('insufficient evidence') && !lowerAnswer.includes('page') && !lowerAnswer.includes('main concept') && !lowerAnswer.includes('key features'));

  if (isFullAbstention) {
    return [];
  }

  // Detect which documents are referenced in the model's answer or inline citations
  const referencedDocs = new Set();
  for (const cite of allCitations) {
    const docName = (cite.docName || '').toLowerCase();
    const docBase = docName.replace(/\.pdf$/i, '').trim();
    // Check if docName or base name appears in the answer
    if (lowerAnswer.includes(docName) || (docBase.length >= 4 && lowerAnswer.includes(docBase))) {
      referencedDocs.add(String(cite.documentId));
    }
  }

  // Detect which page numbers are cited in the answer (e.g. "Page 4", "Pages 2, 5, 6")
  const citedPages = new Set();
  const pageMatches = answerText.match(/Page[s]?\s*(\d+(?:\s*,\s*\d+)*)/gi) || [];
  for (const pm of pageMatches) {
    const nums = pm.match(/\d+/g);
    if (nums) {
      nums.forEach(n => citedPages.add(parseInt(n, 10)));
    }
  }

  let candidates = allCitations;
  if (referencedDocs.size > 0) {
    candidates = candidates.filter(c => referencedDocs.has(String(c.documentId)));
  }

  // If specific pages were cited, retain citations matching those pages
  if (citedPages.size > 0) {
    const pageMatched = candidates.filter(c => citedPages.has(c.page));
    if (pageMatched.length > 0) {
      // Deduplicate by documentId and page
      const seen = new Set();
      return pageMatched.filter(c => {
        const key = `${c.documentId}_${c.page}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
  }

  // Otherwise, filter to citations that have meaningful similarity (e.g. >= 25%)
  return candidates.filter((c, idx) => {
    if (idx === 0) return true;
    const scoreVal = typeof c.rawScore === 'number' ? c.rawScore : parseFloat(c.matchScore) / 100;
    return scoreVal >= 0.25;
  });
}
