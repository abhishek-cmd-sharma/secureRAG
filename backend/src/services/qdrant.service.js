import { QdrantClient } from '@qdrant/js-client-rest';
import crypto from 'crypto';

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || '';
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'securerag_chunks';
const VECTOR_DIMENSION = 768; // Matching text-embedding-004

/**
 * In-memory fallback vector storage for zero-dependency local runs and testing.
 * Implements identical filter and cosine similarity logic to Qdrant.
 */
class InMemoryVectorStore {
  constructor() {
    this.points = new Map(); // id -> { id, vector, payload }
  }

  upsert(points) {
    for (const p of points) {
      this.points.set(String(p.id), {
        id: String(p.id),
        vector: p.vector,
        payload: { ...p.payload }
      });
    }
  }

  deleteByDocumentId(documentId) {
    let count = 0;
    for (const [id, point] of this.points.entries()) {
      if (String(point.payload.documentId) === String(documentId)) {
        this.points.delete(id);
        count++;
      }
    }
    return count;
  }

  search(queryVector, filter = {}, limit = 5, scoreThreshold = 0) {
    const results = [];

    for (const point of this.points.values()) {
      const payload = point.payload;

      // 1. Filter: organizationId must match strictly
      if (filter.organizationId && String(payload.organizationId) !== String(filter.organizationId)) {
        continue;
      }

      // 2. Filter: allowed documentIds list if specified
      if (filter.documentIds && Array.isArray(filter.documentIds)) {
        const docIdStr = String(payload.documentId);
        if (!filter.documentIds.some(id => String(id) === docIdStr)) {
          continue;
        }
      }

      // 3. Filter: specific documentId
      if (filter.documentId && String(payload.documentId) !== String(filter.documentId)) {
        continue;
      }

      // Calculate Cosine Similarity
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      for (let i = 0; i < queryVector.length; i++) {
        dotProduct += queryVector[i] * point.vector[i];
        normA += queryVector[i] * queryVector[i];
        normB += point.vector[i] * point.vector[i];
      }
      const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) || 1);

      if (similarity >= scoreThreshold) {
        results.push({
          id: point.id,
          score: similarity,
          payload: point.payload
        });
      }
    }

    // Sort descending by score
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  count(filter = {}) {
    let c = 0;
    for (const point of this.points.values()) {
      if (filter.organizationId && String(point.payload.organizationId) !== String(filter.organizationId)) {
        continue;
      }
      c++;
    }
    return c;
  }
}

// Global in-memory instance
const memoryStore = new InMemoryVectorStore();
let isQdrantOnline = false;
let qdrantClient = null;

try {
  if (QDRANT_URL) {
    qdrantClient = new QdrantClient({
      url: QDRANT_URL,
      apiKey: QDRANT_API_KEY || undefined,
      checkCompatibility: false
    });
  }
} catch (e) {
  console.warn('[Qdrant] Could not initialize QdrantClient:', e.message);
}

let qdrantStatus = {
  status: 'disconnected', // 'connected', 'disconnected', 'mock_mode'
  mode: 'untested',
  url: QDRANT_URL,
  collection: COLLECTION_NAME,
  dimension: VECTOR_DIMENSION,
  lastError: null
};

export function getQdrantStatus() {
  return { ...qdrantStatus };
}

/**
 * Initializes or validates the Qdrant collection.
 */
export async function initializeQdrant() {
  if (!qdrantClient) {
    qdrantStatus = {
      status: 'mock_mode',
      mode: 'in_memory_fallback',
      url: QDRANT_URL,
      collection: COLLECTION_NAME,
      dimension: VECTOR_DIMENSION,
      lastError: 'No QdrantClient configured'
    };
    return false;
  }

  try {
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME);
    if (!exists) {
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_DIMENSION,
          distance: 'Cosine'
        }
      });
      console.log(`[Qdrant] Created collection '${COLLECTION_NAME}' with size ${VECTOR_DIMENSION}`);
    }
    isQdrantOnline = true;
    qdrantStatus = {
      status: 'connected',
      mode: 'qdrant_server',
      url: QDRANT_URL,
      collection: COLLECTION_NAME,
      dimension: VECTOR_DIMENSION,
      lastError: null
    };
    console.log(`✅ [Qdrant] Connected to real Qdrant cluster at ${QDRANT_URL}`);
    return true;
  } catch (err) {
    isQdrantOnline = false;
    qdrantStatus = {
      status: 'mock_mode',
      mode: 'in_memory_fallback',
      url: QDRANT_URL,
      collection: COLLECTION_NAME,
      dimension: VECTOR_DIMENSION,
      lastError: err.message
    };
    console.log(`⚠️  [Qdrant] Standalone Qdrant server unreachable at ${QDRANT_URL} (${err.message}). Using built-in local vector engine.`);
    return false;
  }
}

/**
 * Upserts document chunks into Qdrant vector storage.
 * 
 * @param {Array<{id?: string, chunkIndex: number, text: string, vector: number[], page: number, documentId: string, organizationId: string, accessLevel: string, allowedRoles: string[]}>} chunks
 */
export async function upsertChunks(chunks) {
  if (!Array.isArray(chunks) || chunks.length === 0) return 0;

  const points = chunks.map(c => {
    // Deterministic UUID for stable point IDs
    const seed = `${c.organizationId}_${c.documentId}_${c.chunkIndex}`;
    const hex = crypto.createHash('md5').update(seed).digest('hex');
    const pointId = `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;

    return {
      id: pointId,
      vector: c.vector,
      payload: {
        documentId: String(c.documentId),
        organizationId: String(c.organizationId),
        chunkIndex: c.chunkIndex,
        chunkId: c.chunkId || `chunk_${c.chunkIndex}`,
        page: c.page || 1,
        text: c.text,
        accessLevel: c.accessLevel || 'Internal',
        allowedRoles: c.allowedRoles || ['admin', 'manager', 'employee']
      }
    };
  });

  // Always mirror in memory store for guaranteed query resilience
  memoryStore.upsert(points);

  if (isQdrantOnline && qdrantClient) {
    try {
      await qdrantClient.upsert(COLLECTION_NAME, {
        wait: true,
        points: points.map(p => ({
          id: p.id,
          vector: p.vector,
          payload: p.payload
        }))
      });
    } catch (err) {
      console.warn(`[Qdrant] Live upsert warning: ${err.message}. Chunks stored in persistent memory store.`);
    }
  }

  return points.length;
}

/**
 * Searches vector index with strict organization and document permission filters.
 * 
 * @param {number[]} queryVector
 * @param {object} filter
 * @param {string} filter.organizationId - Mandatory caller tenant
 * @param {string[]} [filter.documentIds] - List of authorized document ObjectIds
 * @param {string} [filter.documentId] - Specific document scope
 * @param {number} [limit=5]
 * @param {number} [scoreThreshold=0.25]
 * @returns {Promise<Array<{id: string, score: number, payload: object}>>}
 */
export async function searchVectorIndex(queryVector, filter = {}, limit = 5, scoreThreshold = 0.25) {
  if (!filter.organizationId) {
    throw new Error('Security Violation: organizationId filter is required for vector retrieval.');
  }

  if (isQdrantOnline && qdrantClient) {
    try {
      const mustClauses = [
        { key: 'organizationId', match: { value: String(filter.organizationId) } }
      ];

      if (filter.documentIds && Array.isArray(filter.documentIds)) {
        mustClauses.push({
          key: 'documentId',
          match: { any: filter.documentIds.map(String) }
        });
      }

      if (filter.documentId) {
        mustClauses.push({
          key: 'documentId',
          match: { value: String(filter.documentId) }
        });
      }

      const results = await qdrantClient.search(COLLECTION_NAME, {
        vector: queryVector,
        filter: { must: mustClauses },
        limit,
        score_threshold: scoreThreshold,
        with_payload: true
      });

      if (results && results.length > 0) {
        return results;
      }
    } catch (err) {
      console.warn(`[Qdrant] Search error: ${err.message}. Falling back to resilient vector store.`);
    }
  }

  // Fallback to internal vector store
  return memoryStore.search(queryVector, filter, limit, scoreThreshold);
}

/**
 * Deletes all chunks belonging to a document.
 * @param {string} documentId
 */
export async function deleteDocumentVectors(documentId) {
  memoryStore.deleteByDocumentId(documentId);

  if (isQdrantOnline && qdrantClient) {
    try {
      await qdrantClient.delete(COLLECTION_NAME, {
        filter: {
          must: [
            { key: 'documentId', match: { value: String(documentId) } }
          ]
        }
      });
    } catch (err) {
      console.warn(`[Qdrant] Delete vectors warning: ${err.message}`);
    }
  }
}

export const QDRANT_CONFIG = {
  url: QDRANT_URL,
  collection: COLLECTION_NAME,
  isOnline: () => isQdrantOnline
};
