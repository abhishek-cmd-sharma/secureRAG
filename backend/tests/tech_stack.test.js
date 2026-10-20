import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { createApp } from '../src/app.js';
import { seedInitialData } from '../src/utils/seed.js';
import { initializeQdrant, searchVectorIndex } from '../src/services/qdrant.service.js';
import { generateEmbedding } from '../src/services/embedding.service.js';
import { preprocessQueryForRetrieval, filterSupportingCitations } from '../src/controllers/chat.controller.js';
import { Document } from '../src/models/Document.js';

let mongod;
let app;
let adminToken;
let employeeToken;
let testOrgId;
let testDocShopSphereId;
let testDocTitanId;

async function createMultiPagePdfBuffer(pagesText) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const text of pagesText) {
    const page = pdfDoc.addPage([600, 400]);
    page.drawText(text, {
      x: 50,
      y: 350,
      size: 11,
      font,
      maxWidth: 500,
      lineHeight: 14
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

before(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_key_at_least_32_chars_long!';
  process.env.RAG_SIMILARITY_THRESHOLD = '-0.5';
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  await initializeQdrant();
  await seedInitialData();
  app = createApp();

  // Login as admin
  const resAdmin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@novacorp.com', password: 'SecurePass123!' });
  adminToken = resAdmin.body.token;

  // Login as employee
  const resEmp = await request(app)
    .post('/api/auth/login')
    .send({ email: 'elena@novacorp.com', password: 'SecurePass123!' });
  employeeToken = resEmp.body.token;

  const doc = await Document.findOne();
  testOrgId = String(doc.organizationId);

  // Upload multi-page ShopSphere PDF simulating sih team_algo.pdf
  const shopSpherePages = [
    'Smart India Hackathon 2026. Problem Statement ID SIH 26199. Theme Miscellaneous. PS Category Software. Team Algo.',
    'ShopSphere Local Retailers Solution. Find nearby products by chatbot. Check live stock availability and distance.',
    'Workflow. Customer search nearby retailers with stock. Retailer manage stock, get discovered, increase sales.',
    'Feasibility and Viability. Offline-first architecture where essential features work without internet and data syncs automatically when online. Uses existing hardware: works with shopkeeper smartphone camera as barcode scanners. WhatsApp-level ease of use.',
    'Impact and Benefits. Stops food and medicine waste with smart expiry alerts. Smart AI Assistant automatically tracks stock and tells shopkeeper what to reorder. Built for pharmacies with batch and expiry tracking.',
    'Research and References. Competitor comparison table: Vyapar, Khata Book, Zoho, Smart Stock, ShopSphere. Nearby shops and product search through CHAT BOT. Real-time availability.'
  ];
  const pdfShopSphereBuffer = await createMultiPagePdfBuffer(shopSpherePages);

  const uploadRes = await request(app)
    .post('/api/documents/upload')
    .set('Authorization', `Bearer ${adminToken}`)
    .field('title', 'sih team_algo.pdf (1).pdf')
    .field('accessLevel', 'Public')
    .attach('file', pdfShopSphereBuffer, 'sih team_algo.pdf (1).pdf');

  assert.equal(uploadRes.status, 201);
  testDocShopSphereId = String(uploadRes.body.data.id || uploadRes.body.data._id);

  // Upload Project Titan doc with explicit named tech stack
  const titanPages = [
    'Project Titan Engineering Specification. Frontend built with React 19 and TailwindCSS. Backend powered by Node.js, Express, and Apollo GraphQL. Primary database is MongoDB Atlas and vector storage is Qdrant with 768-dimensional embeddings. AI/ML services use Google Gemini 2.5.'
  ];
  const pdfTitanBuffer = await createMultiPagePdfBuffer(titanPages);

  const uploadTitanRes = await request(app)
    .post('/api/documents/upload')
    .set('Authorization', `Bearer ${adminToken}`)
    .field('title', 'Project Titan Tech Spec.pdf')
    .field('accessLevel', 'Internal')
    .attach('file', pdfTitanBuffer, 'Project Titan Tech Spec.pdf');

  assert.equal(uploadTitanRes.status, 201);
  testDocTitanId = String(uploadTitanRes.body.data.id || uploadTitanRes.body.data._id);
});

after(async () => {
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
});

describe('Tech Stack Retrieval & Answer Generation Benchmark Suite', () => {
  
  it('1. Exact technology keyword questions against ShopSphere', async () => {
    const question = 'Which technology is used to make this project?';
    const res = await request(app)
      .post('/api/chat/ask')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ question, documentId: testDocShopSphereId });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    const answer = res.body.data.answer;
    const citations = res.body.data.citations;

    // First sentence must directly address what is documented vs unspecified
    const firstSentence = answer.split('\n')[0];
    assert.ok(
      firstSentence.toLowerCase().includes('not explicitly') ||
      firstSentence.toLowerCase().includes('architectural') ||
      firstSentence.toLowerCase().includes('hardware') ||
      firstSentence.toLowerCase().includes('high-level') ||
      firstSentence.toLowerCase().includes('does not detail') ||
      firstSentence.toLowerCase().includes('technology stack'),
      `First sentence must directly answer query: "${firstSentence}"`
    );

    // Verify structured categories
    assert.ok(answer.includes('Frontend'), 'Must contain Frontend section');
    assert.ok(answer.includes('Backend'), 'Must contain Backend section');
    assert.ok(answer.includes('Database'), 'Must contain Database section');
    assert.ok(answer.includes('AI/ML'), 'Must contain AI/ML section');
    assert.ok(answer.includes('Other tools and integrations'), 'Must contain Other tools section');

    // Verify unmentioned categories state "Not specified"
    assert.ok(answer.includes('Not specified in the document'), 'Must mark missing categories as Not specified in the document');

    // Verify grounded citations attached
    assert.ok(citations.length > 0, 'Must attach supporting citations');
    for (const c of citations) {
      assert.ok(typeof c.rawScore === 'number', 'Must record raw numeric retrieval score');
      assert.ok(c.snippet, 'Must include actual source snippet');
    }
  });

  it('2. Paraphrased technology questions resolve consistently', async () => {
    const paraphrasedQueries = [
      'What is the tech stack?',
      'Which frontend, backend, database, and AI tools are used?',
      'What programming languages and frameworks are mentioned?'
    ];

    for (const query of paraphrasedQueries) {
      // Test preprocessing
      const preprocessed = preprocessQueryForRetrieval(query);
      assert.ok(preprocessed.includes('technology stack'), `Preprocessor must expand technical intent: "${preprocessed}"`);

      const res = await request(app)
        .post('/api/chat/ask')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ question: query, documentId: testDocShopSphereId });

      assert.equal(res.status, 200);
      const answer = res.body.data.answer;

      assert.ok(answer.includes('Frontend'), `Query "${query}" must include structured category Frontend`);
      assert.ok(answer.includes('Database'), `Query "${query}" must include structured category Database`);
      assert.ok(answer.includes('Not specified in the document'), `Query "${query}" must not hallucinate missing tech`);
    }
  });

  it('3. Questions answered on different PDF pages preserve exact page citations', async () => {
    // Page 4: Camera barcode & offline-first
    const resP4 = await request(app)
      .post('/api/chat/ask')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        question: 'How does the barcode scanner and offline functionality work?',
        documentId: testDocShopSphereId
      });

    assert.equal(resP4.status, 200);
    const p4Citations = resP4.body.data.citations;
    assert.ok(p4Citations.some(c => c.page === 4), 'Must cite Page 4 for offline and barcode scanner');

    // Page 5: Smart AI Assistant & pharmacy tracking
    const resP5 = await request(app)
      .post('/api/chat/ask')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        question: 'What are the capabilities of the Smart AI Assistant and pharmacy batch tracking?',
        documentId: testDocShopSphereId
      });

    assert.equal(resP5.status, 200);
    const p5Citations = resP5.body.data.citations;
    assert.ok(p5Citations.some(c => c.page === 5), 'Must cite Page 5 for Smart AI Assistant and pharmacy tracking');
  });

  it('4. Questions whose answers are absent clearly abstain without hallucinating', async () => {
    const res = await request(app)
      .post('/api/chat/ask')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        question: 'What PostgreSQL connection pooling configuration is used in ShopSphere?',
        documentId: testDocShopSphereId
      });

    assert.equal(res.status, 200);
    const answer = res.body.data.answer.toLowerCase();
    assert.ok(
      answer.includes('not specified') ||
      answer.includes('could not find') ||
      answer.includes('no direct evidence') ||
      answer.includes('not contain'),
      'Model must clearly state info is absent rather than inventing config'
    );
  });

  it('5. Multiple documents containing conflicting technology stacks remain strictly isolated', async () => {
    // ShopSphere has no explicit React or Node mentioned
    const resShopSphere = await request(app)
      .post('/api/chat/ask')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        question: 'What is the tech stack?',
        documentId: testDocShopSphereId
      });

    assert.equal(resShopSphere.status, 200);
    // Must NOT contain Titan's stack
    assert.ok(!resShopSphere.body.data.answer.includes('Apollo GraphQL'), 'ShopSphere must not leak Titan stack');

    // Titan explicitly has React 19, Node.js, Express, Qdrant
    const resTitan = await request(app)
      .post('/api/chat/ask')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        question: 'What is the tech stack?',
        documentId: testDocTitanId
      });

    assert.equal(resTitan.status, 200);
    assert.ok(resTitan.body.data.answer.includes('React') || resTitan.body.data.answer.includes('Node.js'), 'Titan must reflect its documented tech stack');
  });

  it('6. Unauthorized documents and tenants are strictly rejected', async () => {
    // 1. Employee querying Restricted document directly
    const restrictedDoc = await Document.findOne({ accessLevel: 'Restricted' });
    if (restrictedDoc) {
      const resDenied = await request(app)
        .post('/api/chat/ask')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          question: 'What is the technology stack?',
          documentId: String(restrictedDoc._id)
        });

      assert.equal(resDenied.status, 403, 'Employee must receive 403 Forbidden on Restricted doc');
    }

    // 2. Querying document from invalid/non-existent tenant
    const resNotFound = await request(app)
      .post('/api/chat/ask')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        question: 'What is the technology stack?',
        documentId: '65f000000000000000000099'
      });

    assert.equal(resNotFound.status, 404, 'Non-existent or cross-tenant doc must return 404');
  });

  it('7. Inspect and record raw retrieval scores without treating scores as confidence percentages', async () => {
    const question = 'Which technology is used to make this project?';
    const queryEmb = await generateEmbedding(preprocessQueryForRetrieval(question));
    
    const results = await searchVectorIndex(
      queryEmb.embedding,
      { organizationId: testOrgId, documentId: String(testDocShopSphereId) },
      6,
      -1.0
    );

    console.log('\n--- Recorded Retrieval Scores for ShopSphere Tech Query ---');
    for (const r of results) {
      console.log(`Page ${r.payload.page}: Cosine Metric = ${r.score.toFixed(4)}, PointId = ${r.id}`);
      assert.ok(typeof r.score === 'number', 'Retrieval score must be a number');
      assert.ok(r.score >= -1 && r.score <= 1, 'Cosine similarity must be in [-1, 1] range');
      assert.ok(r.payload.text && r.payload.text.length > 0, 'Chunk text must be valid extracted source');
    }
  });

});
