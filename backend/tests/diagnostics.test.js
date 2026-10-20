import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { generateEmbedding, generateBatchEmbeddings, getEmbeddingStatus } from '../src/services/embedding.service.js';
import { getDatabaseStatus } from '../src/config/db.js';
import { getQdrantStatus, searchVectorIndex, initializeQdrant } from '../src/services/qdrant.service.js';
import { seedInitialData } from '../src/utils/seed.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';

let mongod;

before(async () => {
  if (mongoose.connection.readyState === 0) {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  }
  await initializeQdrant();
  await seedInitialData();
});

after(async () => {
  if (mongod) {
    await mongoose.connection.close();
    await mongod.stop();
  }
});

describe('Diagnostics & Subsystem Unit Tests', () => {
  describe('1. Embedding Generation & Validation', () => {
    it('generateEmbedding returns a valid finite numeric vector of expected dimension', async () => {
      const res = await generateEmbedding('Testing semantic vector embedding');
      assert.ok(res, 'Must return result object');
      assert.ok(Array.isArray(res.embedding), 'Embedding must be an array');
      assert.ok(res.embedding.length > 0, 'Embedding must not be empty');
      assert.equal(res.embedding.length, 768, 'Embedding length should match configured dimension (768)');
      
      // Validate all elements are finite numbers
      for (const val of res.embedding) {
        assert.equal(typeof val, 'number');
        assert.ok(!Number.isNaN(val));
        assert.ok(Number.isFinite(val));
      }
    });

    it('generateEmbedding throws on empty or non-string input', async () => {
      await assert.rejects(async () => {
        await generateEmbedding('');
      }, /must be a non-empty string/);

      await assert.rejects(async () => {
        await generateEmbedding(null);
      }, /must be a non-empty string/);
    });

    it('generateBatchEmbeddings returns array of matching dimension embeddings', async () => {
      const texts = ['First document passage', 'Second document passage'];
      const embeddings = await generateBatchEmbeddings(texts);
      assert.equal(embeddings.length, 2);
      assert.equal(embeddings[0].embedding.length, 768);
      assert.equal(embeddings[1].embedding.length, 768);
    });

    it('getEmbeddingStatus reports model and dimension correctly', () => {
      const status = getEmbeddingStatus();
      assert.ok(status.model);
      assert.equal(status.dimension, 768);
    });
  });

  describe('2. Vector Store Subsystem Status & Search Filtering', () => {
    it('getQdrantStatus accurately exposes mode and connection details without secrets', () => {
      const status = getQdrantStatus();
      assert.ok(['connected', 'mock_mode', 'disconnected'].includes(status.status));
      assert.ok(['real_qdrant', 'in_memory_fallback', 'untested'].includes(status.mode));
      assert.ok(!status.apiKey, 'API keys must not be exposed in status');
    });

    it('searchVectorIndex enforces organization filter', async () => {
      const dummyVector = new Array(768).fill(0.01);
      const results = await searchVectorIndex(dummyVector, {
        organizationId: '65f000000000000000000099',
        limit: 5
      });
      assert.ok(Array.isArray(results));
      assert.equal(results.length, 0, 'Should find 0 chunks for non-existent org');
    });

    it('searchVectorIndex rejects query without organizationId', async () => {
      const dummyVector = new Array(768).fill(0.01);
      await assert.rejects(async () => {
        await searchVectorIndex(dummyVector, {});
      }, /organizationId filter is required/);
    });
  });

  describe('3. Database Status & Seed Idempotency', () => {
    it('getDatabaseStatus reports state without credentials', () => {
      const status = getDatabaseStatus();
      assert.ok(['connected', 'fallback_memory', 'disconnected'].includes(status.status));
      assert.ok(!status.uri, 'Raw URI must not be exposed');
    });

    it('seedInitialData is idempotent and does not create duplicate organizations or users', async () => {
      const orgCountBefore = await Organization.countDocuments();
      const userCountBefore = await User.countDocuments();

      // Run seed again
      await seedInitialData();

      const orgCountAfter = await Organization.countDocuments();
      const userCountAfter = await User.countDocuments();

      assert.equal(orgCountAfter, orgCountBefore, 'Organization count must not increase on re-seed');
      assert.equal(userCountAfter, userCountBefore, 'User count must not increase on re-seed');
    });
  });

  describe('4. Answer Generation Truncation & Grounding Resilience', () => {
    it('generateAnswerWithGemini returns abstention when context is empty', async () => {
      const { generateAnswerWithGemini } = await import('../src/services/gemini.service.js');
      const res = await generateAnswerWithGemini('What is the remote work policy?', []);
      assert.ok(res.answer.includes('could not find the answer in the accessible documents'));
      assert.equal(res.finishReason, 'NO_CONTEXT');
    });

    it('generateAnswerWithGemini synthesizes complete grounded answer and tracks metrics', async () => {
      const { generateAnswerWithGemini, getGenerationStatus } = await import('../src/services/gemini.service.js');
      const sampleChunks = [
        {
          text: 'ShopSphere is a digital retail platform. Its main concept is modern inventory management for local shops. Key features include offline-first sync, WhatsApp-level ease of use, and smartphone barcode scanning.',
          page: 2,
          documentId: 'doc_123',
          docName: 'ShopSphere Spec.pdf'
        }
      ];
      const res = await generateAnswerWithGemini('What is ShopSphere?', sampleChunks);
      assert.ok(res.answer, 'Must generate answer');
      assert.ok(res.answer.length > 50, 'Must produce a substantive answer');
      assert.ok(!res.answer.endsWith('It aims to save'), 'Must not truncate mid-sentence');
      assert.ok(res.finishReason, 'Must include finishReason');
      
      const status = getGenerationStatus();
      assert.ok(status.model);
      assert.ok(status.status);
    });
  });
});
