import { QdrantClient } from '@qdrant/js-client-rest';
import crypto from 'crypto';

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || '';
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'securerag_chunks';
const VECTOR_DIMENSION = parseInt(process.env.EMBEDDING_DIMENSION || '768', 10);

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

  getChunks(documentId, organizationId) {
    const list = [];
    for (const point of this.points.values()) {
      const payload = point.payload;
      if (organizationId && String(payload.organizationId) !== String(organizationId)) continue;
      if (String(payload.documentId) === String(documentId)) {
        list.push({ ...payload, id: point.id });
      }
    }
    list.sort((a, b) => (a.page - b.page) || (a.chunkIndex - b.chunkIndex));
    return list;
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

function getClient() {
  if (qdrantClient) return qdrantClient;
  if (!QDRANT_URL) return null;

  try {
    const clientOptions = {
      url: QDRANT_URL,
      checkCompatibility: false
    };
    if (QDRANT_API_KEY && QDRANT_API_KEY.trim() !== '') {
      clientOptions.apiKey = QDRANT_API_KEY.trim();
    }
    qdrantClient = new QdrantClient(clientOptions);
    return qdrantClient;
  } catch (err) {
    console.warn('[Qdrant] Could not initialize QdrantClient:', err.message);
    return null;
  }
}

// Attempt initial client instance creation
getClient();

let qdrantStatus = {
  status: 'disconnected', // 'connected', 'disconnected', 'mock_mode'
  mode: 'untested',       // 'real_qdrant', 'in_memory_fallback', 'untested'
  url: QDRANT_URL,
  collection: COLLECTION_NAME,
  dimension: VECTOR_DIMENSION,
  lastError: null
};

export function getQdrantStatus() {
  // Always sanitize to ensure secrets are never leaked
  return {
    status: qdrantStatus.status,
    mode: qdrantStatus.mode,
    url: qdrantStatus.url,
    collection: qdrantStatus.collection,
    dimension: qdrantStatus.dimension,
    lastError: qdrantStatus.lastError
  };
}

/**
 * Initializes or validates the Qdrant collection.
 * Creates collection with appropriate dimension and distance metric if it does not exist.
 */
export async function initializeQdrant() {
  const client = getClient();
  if (!client) {
    qdrantStatus = {
      status: 'disconnected',
      mode: 'in_memory_fallback',
      url: QDRANT_URL,
      collection: COLLECTION_NAME,
      dimension: VECTOR_DIMENSION,
      lastError: 'No QdrantClient configured'
    };
    return false;
  }

  try {
    let collectionExists = false;
    try {
      const checkRes = await client.collectionExists(COLLECTION_NAME);
      collectionExists = Boolean(checkRes?.exists);
    } catch {
      const collections = await client.getCollections();
      collectionExists = collections?.collections?.some(c => c.name === COLLECTION_NAME);
    }

    if (!collectionExists) {
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_DIMENSION,
          distance: 'Cosine'
        }
      });
      console.log(`[Qdrant] Created collection '${COLLECTION_NAME}' with size ${VECTOR_DIMENSION} and Cosine metric`);
    }

    // Ensure payload indexes exist for tenant-scoped filtering
    try {
      await client.createPayloadIndex(COLLECTION_NAME, {
        field_name: 'organizationId',
        field_schema: 'keyword'
      });
      await client.createPayloadIndex(COLLECTION_NAME, {
        field_name: 'documentId',
        field_schema: 'keyword'
      });
    } catch {
      // Non-blocking: indices may already exist
    }

    isQdrantOnline = true;
    qdrantStatus = {
      status: 'connected',
      mode: 'real_qdrant',
      url: QDRANT_URL,
      collection: COLLECTION_NAME,
      dimension: VECTOR_DIMENSION,
      lastError: null
    };
    console.log(`✅ [Qdrant] Connected to real Qdrant cluster at ${QDRANT_URL} (collection: ${COLLECTION_NAME})`);
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

  if (!isQdrantOnline) {
    await initializeQdrant();
  }

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
        docName: c.docName || c.documentTitle || 'Document',
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

  const client = getClient();
  if (isQdrantOnline && client) {
    try {
      await client.upsert(COLLECTION_NAME, {
        wait: true,
        points: points.map(p => ({
          id: p.id,
          vector: p.vector,
          payload: p.payload
        }))
      });
      console.log(`[Qdrant Upsert] Ingested ${points.length} chunk vectors for document ID ${chunks[0]?.documentId}`);
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

  if (!isQdrantOnline) {
    await initializeQdrant();
  }

  const client = getClient();
  if (isQdrantOnline && client) {
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

      const queryParams = {
        query: queryVector,
        filter: { must: mustClauses },
        limit,
        with_payload: true
      };

      if (typeof scoreThreshold === 'number' && scoreThreshold > 0) {
        queryParams.score_threshold = scoreThreshold;
      }

      const queryResult = await client.query(COLLECTION_NAME, queryParams);
      const points = queryResult?.points || [];
      console.log(`[Qdrant Search] Tenant: ${filter.organizationId}, Scoped Docs: ${filter.documentIds ? filter.documentIds.length : 'unrestricted'}, Found: ${points.length} points, Top Score: ${points[0]?.score ? (points[0].score * 100).toFixed(1) + '%' : 'none'}`);
      return points.map(p => ({
        id: p.id,
        score: p.score,
        payload: p.payload
      }));
    } catch (err) {
      console.warn(`[Qdrant] Search error: ${err.message}. Falling back to resilient vector store.`);
    }
  }

  // Fallback to internal vector store
  return memoryStore.search(queryVector, filter, limit, scoreThreshold);
}

/**
 * Retrieves all indexed chunks belonging to a document in page order.
 * Enforces tenant isolation.
 * 
 * @param {string} documentId
 * @param {string} organizationId
 * @returns {Promise<Array<object>>}
 */
export async function getDocumentChunks(documentId, organizationId) {
  if (!organizationId) {
    throw new Error('Security Violation: organizationId is required to fetch document chunks.');
  }

  const client = getClient();
  if (isQdrantOnline && client) {
    try {
      const scrollRes = await client.scroll(COLLECTION_NAME, {
        filter: {
          must: [
            { key: 'organizationId', match: { value: String(organizationId) } },
            { key: 'documentId', match: { value: String(documentId) } }
          ]
        },
        limit: 100,
        with_payload: true,
        with_vector: false
      });
      const points = scrollRes?.points || [];
      if (points.length > 0) {
        const chunks = points.map(p => ({ ...p.payload, id: p.id }));
        chunks.sort((a, b) => (a.page - b.page) || (a.chunkIndex - b.chunkIndex));
        return chunks;
      }
    } catch (err) {
      console.warn(`[Qdrant] getDocumentChunks error: ${err.message}. Using memory fallback.`);
    }
  }

  return memoryStore.getChunks(documentId, organizationId);
}

/**
 * Deletes all chunks belonging to a document.
 * @param {string} documentId
 */
export async function deleteDocumentVectors(documentId) {
  memoryStore.deleteByDocumentId(documentId);

  const client = getClient();
  if (isQdrantOnline && client) {
    try {
      await client.delete(COLLECTION_NAME, {
        wait: true,
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
