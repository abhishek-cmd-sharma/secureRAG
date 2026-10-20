import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

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
 * Extracts text from a DOCX file using mammoth
 */
export async function extractTextFromDocx(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const rawText = cleanPageText(result.value || '');
    if (!rawText || rawText.trim().length === 0) {
      throw new Error('Empty DOCX document: No extractable text found.');
    }

    // Split into ~1500-character pseudo pages for clean citation targeting
    const paragraphs = rawText.split(/\n\n+/);
    const pages = [];
    let currentPageText = '';
    let pageNum = 1;

    for (const p of paragraphs) {
      if ((currentPageText + '\n\n' + p).length > 1500 && currentPageText.length > 0) {
        pages.push({ page: pageNum++, text: currentPageText.trim() });
        currentPageText = p;
      } else {
        currentPageText = currentPageText ? `${currentPageText}\n\n${p}` : p;
      }
    }
    if (currentPageText.trim()) {
      pages.push({ page: pageNum, text: currentPageText.trim() });
    }

    return {
      text: rawText,
      pages: pages.length > 0 ? pages : [{ page: 1, text: rawText }],
      numPages: pages.length || 1
    };
  } catch (err) {
    if (err.message && err.message.includes('Empty DOCX')) throw err;
    throw new Error(`DOCX Extraction Failed: ${err.message || 'Unable to parse DOCX file'}`);
  }
}

/**
 * Extracts text from a plain TXT or Markdown file
 */
export async function extractTextFromTxt(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const cleaned = cleanPageText(content);
  if (!cleaned || cleaned.trim().length === 0) {
    throw new Error('Empty text document: File contains no readable characters.');
  }

  const paragraphs = cleaned.split(/\n\n+/);
  const pages = [];
  let currentPageText = '';
  let pageNum = 1;

  for (const p of paragraphs) {
    if ((currentPageText + '\n\n' + p).length > 1500 && currentPageText.length > 0) {
      pages.push({ page: pageNum++, text: currentPageText.trim() });
      currentPageText = p;
    } else {
      currentPageText = currentPageText ? `${currentPageText}\n\n${p}` : p;
    }
  }
  if (currentPageText.trim()) {
    pages.push({ page: pageNum, text: currentPageText.trim() });
  }

  return {
    text: cleaned,
    pages: pages.length > 0 ? pages : [{ page: 1, text: cleaned }],
    numPages: pages.length || 1
  };
}

/**
 * Unified document extractor dispatching by file extension
 */
export async function extractTextFromFile(filePath, originalFileName = '') {
  const ext = path.extname(originalFileName || filePath).toLowerCase();
  if (ext === '.pdf') {
    return extractTextFromPdf(filePath);
  } else if (ext === '.docx') {
    return extractTextFromDocx(filePath);
  } else if (ext === '.txt' || ext === '.md' || ext === '.text') {
    return extractTextFromTxt(filePath);
  } else {
    return extractTextFromPdf(filePath);
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
