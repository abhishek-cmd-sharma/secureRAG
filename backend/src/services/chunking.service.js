/**
 * Chunking Service
 * Splits text into manageable, overlapping chunks while preserving page numbers and metadata.
 */

// Approximate token ratio (~4 characters per token for English text)
const CHARS_PER_TOKEN = 4;

/**
 * Creates sliding window chunks from an array of page objects or plain text.
 * Target: ~800 tokens (~3200 chars) with ~120 tokens (~480 chars) overlap.
 * 
 * @param {Array<{page: number, text: string}>|string} inputPages
 * @param {object} options
 * @param {number} [options.targetTokens=800]
 * @param {number} [options.overlapTokens=120]
 * @param {string} [options.documentId]
 * @param {string} [options.organizationId]
 * @returns {Array<{chunkIndex: number, text: string, page: number, tokenCount: number, chunkId: string}>}
 */
export function chunkDocument(inputPages, options = {}) {
  const targetTokens = options.targetTokens || 800;
  const overlapTokens = options.overlapTokens || 120;
  const targetChars = targetTokens * CHARS_PER_TOKEN;
  const overlapChars = overlapTokens * CHARS_PER_TOKEN;

  let pages = [];
  if (typeof inputPages === 'string') {
    pages = [{ page: 1, text: inputPages }];
  } else if (Array.isArray(inputPages)) {
    pages = inputPages;
  } else {
    throw new Error('Invalid input to chunkDocument: expected string or array of pages');
  }

  const chunks = [];
  let chunkIndex = 0;

  for (const pageObj of pages) {
    const pageText = (pageObj.text || '').trim();
    const pageNum = pageObj.page || 1;

    if (!pageText) continue;

    // If page is smaller than target size, keep it as single chunk
    if (pageText.length <= targetChars) {
      chunks.push({
        chunkIndex: chunkIndex++,
        text: pageText,
        page: pageNum,
        tokenCount: Math.ceil(pageText.length / CHARS_PER_TOKEN),
        chunkId: `chunk_${pageNum}_${chunkIndex}`
      });
      continue;
    }

    // Split page using sliding window on sentence or paragraph boundaries
    let startIndex = 0;
    while (startIndex < pageText.length) {
      let endIndex = Math.min(startIndex + targetChars, pageText.length);

      // If not at the very end of page, break at nearest sentence or newline
      if (endIndex < pageText.length) {
        const boundarySearch = pageText.substring(startIndex, endIndex);
        const lastPeriod = Math.max(
          boundarySearch.lastIndexOf('. '),
          boundarySearch.lastIndexOf('.\n'),
          boundarySearch.lastIndexOf('\n\n')
        );
        if (lastPeriod > targetChars * 0.5) {
          endIndex = startIndex + lastPeriod + 1;
        }
      }

      const chunkContent = pageText.substring(startIndex, endIndex).trim();
      if (chunkContent.length > 20) { // filter trivial artifacts
        chunks.push({
          chunkIndex: chunkIndex++,
          text: chunkContent,
          page: pageNum,
          tokenCount: Math.ceil(chunkContent.length / CHARS_PER_TOKEN),
          chunkId: `chunk_${pageNum}_${chunkIndex}`
        });
      }

      if (endIndex >= pageText.length) break;

      // Advance by target minus overlap
      startIndex += Math.max(targetChars - overlapChars, 100);
    }
  }

  return chunks;
}
