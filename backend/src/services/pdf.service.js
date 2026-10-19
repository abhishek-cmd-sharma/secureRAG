import fs from 'fs';
import { PDFParse } from 'pdf-parse';

/**
 * Extracts raw and page-aware text from a PDF buffer or file path.
 * Uses official modern pdf-parse API with robust page indexing and cleaning.
 * 
 * @param {Buffer|string} input - PDF buffer or absolute file path
 * @returns {Promise<{text: string, pages: Array<{page: number, text: string}>, numPages: number}>}
 */
export async function extractTextFromPdf(input) {
  let dataBuffer;
  if (typeof input === 'string') {
    dataBuffer = fs.readFileSync(input);
  } else if (Buffer.isBuffer(input)) {
    dataBuffer = input;
  } else {
    throw new Error('Invalid input: must be a Buffer or file path string');
  }

  // Check minimum PDF header signature (%PDF-)
  if (dataBuffer.length < 5 || dataBuffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw new Error('Invalid file format: File header is not a valid PDF document (%PDF- signature missing).');
  }

  let parser = null;
  try {
    parser = new PDFParse({ data: dataBuffer });
    const textResult = await parser.getText();

    const rawText = textResult?.text || '';
    const cleanedText = cleanPageText(rawText);

    if (!cleanedText || cleanedText.trim().length === 0) {
      throw new Error('Empty PDF or Scanned Document: No extractable text found. (Note: OCR is not implemented in this phase).');
    }

    const pages = (textResult.pages || []).map((p, idx) => ({
      page: p.num || idx + 1,
      text: cleanPageText(p.text || '')
    }));

    return {
      text: cleanedText,
      pages: pages.length > 0 ? pages : [{ page: 1, text: cleanedText }],
      numPages: textResult.total || pages.length || 1
    };
  } catch (err) {
    if (err.message && (err.message.includes('Empty PDF') || err.message.includes('signature missing'))) {
      throw err;
    }
    throw new Error(`PDF Extraction Failed: ${err.message || 'Unable to parse document'}`);
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (e) {}
    }
  }
}

/**
 * Normalizes text while preserving natural paragraph boundaries.
 * @param {string} raw
 * @returns {string}
 */
export function cleanPageText(raw) {
  if (!raw) return '';
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/-- \d+ of \d+ --/g, '') // strip page markers
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
