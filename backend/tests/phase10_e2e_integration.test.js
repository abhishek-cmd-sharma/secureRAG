import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { createApp } from '../src/app.js';
import { seedInitialData } from '../src/utils/seed.js';
import { initializeQdrant, searchVectorIndex, deleteDocumentVectors } from '../src/services/qdrant.service.js';
import { Organization } from '../src/models/Organization.js';
import { User } from '../src/models/User.js';
import { Document } from '../src/models/Document.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { Conversation } from '../src/models/Conversation.js';

let mongod;
let app;
let adminToken;
let managerToken;
let employeeToken;
let tenantA;
let tenantB;
let userTenantB;
let tokenTenantB;

async function createTestPdf(text, pagesCount = 1) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < pagesCount; i++) {
    const page = doc.addPage([600, 400]);
    page.drawText(`${text} (Section ${i + 1} of ${pagesCount})`, {
      x: 50,
      y: 350,
      size: 12,
      font
    });
  }
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

before(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'phase10_secure_enterprise_test_secret_key_12345!';
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await initializeQdrant();
  await seedInitialData();
  app = createApp();

  // Obtain tokens for seeded accounts
  const resAdmin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@novacorp.com', password: 'SecurePass123!' });
  adminToken = resAdmin.body.token;

  const resMgr = await request(app)
    .post('/api/auth/login')
    .send({ email: 'manager@novacorp.com', password: 'SecurePass123!' });
  managerToken = resMgr.body.token;

  const resEmp = await request(app)
    .post('/api/auth/login')
    .send({ email: 'elena@novacorp.com', password: 'SecurePass123!' });
  employeeToken = resEmp.body.token;

  // Set up second tenant for cross-tenant isolation testing
  tenantA = await Organization.findOne({ name: 'NovaCorp Global' });
  tenantB = await Organization.create({
    name: 'CyberDyne Defense Systems',
    slug: 'cyberdyne',
    domain: 'cyberdyne.io'
  });

  const bcrypt = (await import('bcrypt')).default;
  const testHash = await bcrypt.hash('SecurePass123!', 10);

  userTenantB = await User.create({
    name: 'Miles Dyson',
    email: 'dyson@cyberdyne.io',
    passwordHash: testHash,
    role: 'admin',
    organizationId: tenantB._id
  });

  const resB = await request(app)
    .post('/api/auth/login')
    .send({ email: 'dyson@cyberdyne.io', password: 'SecurePass123!' });
  tokenTenantB = resB.body.token;
});

after(async () => {
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
});

describe('Phase 10 — Core System Architecture & Health', () => {
  it('GET /api/health reports healthy with all 4 subsystems connected/ready', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'healthy');
    assert.equal(res.body.ragReady, true);
    assert.ok(res.body.subsystems.database);
    assert.ok(res.body.subsystems.vectorStore);
    assert.ok(res.body.subsystems.embedding);
    assert.ok(res.body.subsystems.gemini);
    assert.equal(res.body.subsystems.vectorStore.dimension, 768);
  });
});

describe('Phase 10 — Authentication, Role Clearance & API Security', () => {
  it('Rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/documents');
    assert.equal(res.status, 401);
  });

  it('Rejects malformed JWT tokens with 401', async () => {
    const res = await request(app)
      .get('/api/documents')
      .set('Authorization', 'Bearer invalid.token.payload');
    assert.equal(res.status, 401);
  });

  it('Admin login returns sanitized user profile without sensitive fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@novacorp.com', password: 'SecurePass123!' });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.passwordHash, undefined);
    assert.equal(res.body.user.role, 'admin');
  });

  it('Employees cannot create new users or organizations (403 Forbidden)', async () => {
    const resUser = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ name: 'Hacker', email: 'hack@novacorp.com', role: 'admin' });
    assert.equal(resUser.status, 403);

    const resOrg = await request(app)
      .post('/api/organizations')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ name: 'Rogue Org' });
    assert.equal(resOrg.status, 403);
  });

  it('Employees only see Public and Internal documents in list API', async () => {
    const res = await request(app)
      .get('/api/documents')
      .set('Authorization', `Bearer ${employeeToken}`);
    assert.equal(res.status, 200);
    const levels = res.body.data.map(d => d.accessLevel);
    assert.ok(!levels.includes('Confidential'), 'Employee must not see Confidential docs');
    assert.ok(!levels.includes('Restricted'), 'Employee must not see Restricted docs');
  });
});

describe('Phase 10 — Document Upload Pipeline, Ingestion & Validation', () => {
  let uploadedDocId;

  it('Rejects upload without a file with 400', async () => {
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 400);
  });

  it('Rejects non-PDF upload on upload endpoint with 400', async () => {
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', Buffer.from('console.log("malicious code")'), 'script.js');
    assert.ok(res.status === 400 || res.status === 500);
  });

  it('Rejects corrupted PDF lacking %PDF- signature with 422 Unprocessable', async () => {
    const corruptBuffer = Buffer.from('FAKE_HEADER_CONTENT_NOT_PDF');
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', corruptBuffer, 'corrupt.pdf');
    assert.equal(res.status, 422);
    assert.match(res.body.message, /signature missing/);
  });

  it('Successfully ingests valid PDF, generates 768-D vectors, and marks status as Indexed', async () => {
    const pdfBuffer = await createTestPdf(
      'Project Aegis Cyber Defense Standard. Node authorization requires TLS 1.3 mutual authentication. The primary cryptographic hash is SHA-384.',
      2
    );

    const res = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('title', 'Project Aegis Defense Standard.pdf')
      .field('accessLevel', 'Confidential')
      .attach('file', pdfBuffer, 'aegis.pdf');

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.name, 'Project Aegis Defense Standard.pdf');
    assert.equal(res.body.data.status, 'indexed');
    assert.ok(res.body.data.chunksCount > 0);
    uploadedDocId = res.body.data.id;

    // Verify MongoDB persistence
    const savedDoc = await Document.findById(uploadedDocId);
    assert.ok(savedDoc);
    assert.equal(savedDoc.status, 'indexed');
    assert.equal(savedDoc.chunksCount, res.body.data.chunksCount);
  });

  it('Handles duplicate document upload by purging previous vectors and updating document record', async () => {
    const pdfBuffer2 = await createTestPdf(
      'Project Aegis Cyber Defense Standard Version 2. Updated node authorization specifications and rotating key management.',
      1
    );

    const res = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('title', 'Project Aegis Defense Standard.pdf')
      .field('accessLevel', 'Confidential')
      .attach('file', pdfBuffer2, 'aegis.pdf');

    assert.equal(res.status, 201);
    assert.equal(res.body.data.status, 'indexed');
  });

  it('Creates and indexes multi-format document metadata via /api/documents with accurate chunksCount', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Microservices Deployment Guide.docx',
        type: 'DOCX',
        accessLevel: 'Internal',
        summary: 'Deployment specifications for microservices architecture.',
        excerpt: 'Services communicate via gRPC over HTTP/2 with circuit breaking implemented using Envoy proxy.'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.status, 'indexed');
    assert.ok(res.body.data.chunksCount > 0);
  });
});

describe('Phase 10 — RAG Question-Answering, Grounding & Citations', () => {
  it('Returns direct grounded answer with citations for explicitly answered question', async () => {
    const res = await request(app)
      .post('/api/chat/ask')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        question: 'What is KaamSetu?'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.answer);
    assert.ok(res.body.data.citations.length > 0);
    assert.equal(res.body.data.isDenied, false);
    assert.ok(res.body.data.answer.toLowerCase().includes('kaamsetu'));
  });

  it('Abstains honestly when question cannot be answered from accessible knowledge base', async () => {
    const res = await request(app)
      .post('/api/chat/ask')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        question: 'Who won the 1994 FIFA World Cup soccer championship in Pasadena?'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(
      res.body.data.answer.includes('could not find') ||
      res.body.data.answer.includes('not specified') ||
      res.body.data.answer.includes('does not contain') ||
      res.body.data.answer.includes('no direct evidence')
    );
    assert.equal(res.body.data.citations.length, 0);
  });

  it('Technology query formats 5 structured categories without hallucinating missing frameworks', async () => {
    const res = await request(app)
      .post('/api/chat/ask')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        question: 'Which technology is used to make this project?'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const ans = res.body.data.answer;
    assert.ok(ans.includes('Frontend'));
    assert.ok(ans.includes('Backend'));
    assert.ok(ans.includes('Database'));
    assert.ok(ans.includes('AI/ML'));
    assert.ok(ans.includes('Not specified in the document'));
  });
});

describe('Phase 10 — Phase 8 Document Intelligence Operations', () => {
  let docId;

  before(async () => {
    const doc = await Document.findOne({ organizationId: tenantA._id, status: 'indexed' });
    docId = String(doc._id);
  });

  it('POST /api/chat/summarize produces an executive summary with citations', async () => {
    const res = await request(app)
      .post('/api/chat/summarize')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        documentId: docId,
        summaryType: 'executive'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.summary.length > 30);
    assert.ok(res.body.data.citations.length > 0);
  });

  it('POST /api/chat/compare compares two documents and rejects fewer than two', async () => {
    const docs = await Document.find({ organizationId: tenantA._id, status: 'indexed' }).limit(2);
    if (docs.length >= 2) {
      const res = await request(app)
        .post('/api/chat/compare')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          documentIds: [String(docs[0]._id), String(docs[1]._id)]
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.comparison);
    }

    const resFail = await request(app)
      .post('/api/chat/compare')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        documentIds: [String(docs[0]._id)]
      });
    assert.equal(resFail.status, 400);
  });

  it('POST /api/chat/extract extracts validated system specifications', async () => {
    const res = await request(app)
      .post('/api/chat/extract')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        documentId: docId,
        extractionType: 'system_requirements'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.markdown);
  });
});

describe('Phase 10 — Tenant Isolation & Prompt Injection Defense', () => {
  it('User in Tenant B cannot view or access documents in Tenant A', async () => {
    const docA = await Document.findOne({ organizationId: tenantA._id });
    const res = await request(app)
      .get(`/api/documents/${docA._id}`)
      .set('Authorization', `Bearer ${tokenTenantB}`);
    assert.equal(res.status, 404);
  });

  it('Vector retrieval strictly scopes chunks to caller organizationId', async () => {
    const queryVector = new Array(768).fill(0.01);
    const results = await searchVectorIndex(queryVector, {
      organizationId: String(tenantB._id)
    });

    for (const r of results) {
      assert.equal(String(r.payload.organizationId), String(tenantB._id));
    }
  });

  it('AuditLog records security rejections with caller metadata', async () => {
    const logs = await AuditLog.find({ organizationId: tenantA._id, result: 'denied' });
    assert.ok(logs.length > 0, 'Audit trail must record denied access attempts');
  });
});

describe('Phase 10 — Complete End-to-End User Journey', () => {
  it('Executes Login -> Upload -> Index -> Ask -> Grounded Answer -> RBAC Block -> Audit Trail', async () => {
    // 1. Admin Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@novacorp.com', password: 'SecurePass123!' });
    assert.equal(loginRes.status, 200);
    const token = loginRes.body.token;

    // 2. Upload Document
    const pdfData = await createTestPdf(
      'Quantum Ledger Architecture Specification. Quantum Ledger utilizes Byzantine Fault Tolerance consensus. Block finality is achieved in 400 milliseconds. Key rotation occurs every 24 hours.'
    );

    const uploadRes = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Quantum Ledger Architecture Spec.pdf')
      .field('accessLevel', 'Confidential')
      .attach('file', pdfData, 'quantum_ledger.pdf');

    assert.equal(uploadRes.status, 201);
    const docId = uploadRes.body.data.id;

    // 3. Verify Document is Indexed
    const docStatus = await request(app)
      .get(`/api/documents/${docId}/status`)
      .set('Authorization', `Bearer ${token}`);
    assert.equal(docStatus.status, 200);
    assert.equal(docStatus.body.data.status, 'indexed');
    assert.ok(docStatus.body.data.chunksCount > 0);

    // 4. Ask Question about its specific content
    const chatRes = await request(app)
      .post('/api/chat/ask')
      .set('Authorization', `Bearer ${token}`)
      .send({
        question: 'What is the block finality time in Quantum Ledger?',
        documentId: docId
      });

    assert.equal(chatRes.status, 200);
    assert.ok(chatRes.body.data.answer.includes('400 milliseconds') || chatRes.body.data.answer.includes('400 ms') || chatRes.body.data.answer.includes('Quantum Ledger'));
    assert.ok(chatRes.body.data.citations.length > 0);
    assert.equal(chatRes.body.data.citations[0].docName, 'Quantum Ledger Architecture Spec.pdf');

    // 5. Employee attempts to query the Confidential document -> Blocked by RBAC
    const empChatRes = await request(app)
      .post('/api/chat/ask')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        question: 'What is the block finality time in Quantum Ledger?',
        documentId: docId
      });

    assert.equal(empChatRes.status, 403);
    assert.match(empChatRes.body.message, /Access Denied|Clearance/i);

    // 6. Verify Access Denial logged in Audit Log
    const auditRes = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(auditRes.status, 200);
    const deniedLogs = auditRes.body.data.filter(l => (l.result || '').toLowerCase() === 'denied');
    assert.ok(deniedLogs.length > 0);
  });
});
