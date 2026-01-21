import Tesseract from 'tesseract.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import fs from 'fs/promises';

export async function extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  } else if (mimeType.startsWith('image/')) {
    const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
    return text;
  }
  throw new Error('Unsupported file type');
}
