import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';

const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || process.env.EMBEDDING_MODEL || 'gemini-embedding-001';
const EMBEDDING_DIMENSION = parseInt(process.env.EMBEDDING_DIMENSION || '768', 10);

let lastEmbeddingStatus = {
  status: 'initialized',
  model: EMBEDDING_MODEL,
  dimension: EMBEDDING_DIMENSION,
  provider: 'untested',
  lastError: null,
  lastUpdated: new Date().toISOString()
};

export function getEmbeddingStatus() {
  return { ...lastEmbeddingStatus };
}

/**
 * Generates an embedding vector for given text.
 * Uses official Gemini gemini-embedding-001 with 768 outputDimensionality.
 * 
 * @param {string} text - text to embed
 * @returns {Promise<{embedding: number[], model: string, dimension: number, isRealEmbedding: boolean}>}
 */
export async function generateEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text to embed must be a non-empty string');
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'mock_key' && !apiKey.startsWith('demo')) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: text,
        config: {
          outputDimensionality: EMBEDDING_DIMENSION
        }
      });

      // Google GenAI SDK returns embeddings array
      const values = response?.embeddings?.[0]?.values || response?.embedding?.values;
      if (Array.isArray(values) && values.length > 0) {
        validateVector(values, EMBEDDING_DIMENSION);
        lastEmbeddingStatus = {
          status: 'connected',
          model: EMBEDDING_MODEL,
          dimension: values.length,
          provider: 'google_genai_live',
          lastError: null,
          lastUpdated: new Date().toISOString()
        };
        return {
          embedding: values,
          model: EMBEDDING_MODEL,
          dimension: values.length,
          isRealEmbedding: true
        };
      } else {
        throw new Error('Gemini API returned empty vector array.');
      }
    } catch (err) {
      console.warn(`[Embedding] Live Gemini API call failed (${err.message}).`);
      lastEmbeddingStatus = {
        status: 'degraded',
        model: EMBEDDING_MODEL,
        dimension: EMBEDDING_DIMENSION,
        provider: 'fallback_mock',
        lastError: err.message,
        lastUpdated: new Date().toISOString()
      };

      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Production Embedding Error: ${err.message}`);
      }
    }
  }

  // Resilient deterministic high-dimensional embedding generator for local/offline testing
  const fallbackVector = generateDeterministicEmbedding(text, EMBEDDING_DIMENSION);
  validateVector(fallbackVector, EMBEDDING_DIMENSION);
  return {
    embedding: fallbackVector,
    model: `${EMBEDDING_MODEL}-mock_mode`,
    dimension: EMBEDDING_DIMENSION,
    isRealEmbedding: false
  };
}

/**
 * Generates multiple embeddings in batches.
 * @param {string[]} texts
 * @returns {Promise<Array<{embedding: number[], model: string, dimension: number}>>}
 */
export async function generateBatchEmbeddings(texts) {
  const results = [];
  for (const text of texts) {
    const res = await generateEmbedding(text);
    results.push(res);
  }
  return results;
}

/**
 * Validates that vector elements are finite numeric numbers of the expected length.
 */
export function validateVector(vector, expectedLength = EMBEDDING_DIMENSION) {
  if (!Array.isArray(vector)) {
    throw new Error('Vector must be an array');
  }
  if (expectedLength && vector.length !== expectedLength) {
    throw new Error(`Vector length mismatch: expected ${expectedLength}, got ${vector.length}`);
  }
  for (let i = 0; i < vector.length; i++) {
    if (typeof vector[i] !== 'number' || !Number.isFinite(vector[i])) {
      throw new Error(`Invalid vector element at index ${i}: not a finite number`);
    }
  }
}

/**
 * Generates a deterministic unit-length vector of dimension D from string content.
 * Guarantees that semantically similar or identical texts yield mathematically consistent cosine similarities.
 */
function generateDeterministicEmbedding(text, dimension = 768) {
  const words = text.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean);
  const vector = new Array(dimension).fill(0);

  // Distribute word hashes across vector indices
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const hash = crypto.createHash('sha256').update(word).digest();
    for (let j = 0; j < 32; j++) {
      const idx = (hash[j] + j * 23) % dimension;
      vector[idx] += ((hash[(j + 1) % 32] % 100) - 50) / 100;
    }
  }

  // Normalize to unit length (L2 norm)
  let norm = 0;
  for (let v of vector) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm === 0) norm = 1;

  for (let i = 0; i < dimension; i++) {
    vector[i] = vector[i] / norm;
  }

  return vector;
}

export const EMBEDDING_CONFIG = {
  model: EMBEDDING_MODEL,
  dimension: EMBEDDING_DIMENSION
};
