import { describe, expect, it } from 'vitest';
import { detectDocumentExtension, parseDocumentLocally } from '../src/services/document-parser';
import { buildTranslatedFilename, formatFileSize, splitTextIntoChunks } from '../src/utils/format';

describe('Local browser document parser & chunker', () => {
  it('detects PDF, DOCX, and TXT files accurately', () => {
    expect(detectDocumentExtension(new File([''], 'report.pdf', { type: 'application/pdf' }))).toBe('pdf');
    expect(detectDocumentExtension(new File([''], 'notes.docx'))).toBe('docx');
    expect(detectDocumentExtension(new File(['hello'], 'readme.txt', { type: 'text/plain' }))).toBe('txt');
    expect(detectDocumentExtension(new File([''], 'archive.zip', { type: 'application/zip' }))).toBeNull();
  });

  it('parses TXT documents locally in memory', async () => {
    const file = new File(['Первая строка\n\nВторая строка'], 'sample.txt', { type: 'text/plain' });
    const parsed = await parseDocumentLocally(file);
    expect(parsed.extension).toBe('txt');
    expect(parsed.fileName).toBe('sample.txt');
    expect(parsed.text).toBe('Первая строка\n\nВторая строка');
  });

  it('splits multi-paragraph documents cleanly without losing formatting', () => {
    const p1 = 'Paragraph one. '.repeat(25).trim();
    const p2 = 'Paragraph two. '.repeat(25).trim();
    const p3 = 'Paragraph three. '.repeat(25).trim();
    const chunks = splitTextIntoChunks(`${p1}\n\n${p2}\n\n${p3}`, 500);

    expect(chunks.length).toBe(3);
    expect(chunks[0]).toBe(p1);
    expect(chunks[1]).toBe(p2);
    expect(chunks[2]).toBe(p3);
  });

  it('formats file sizes matching layouts/documentstranslationexample.png', () => {
    expect(formatFileSize(2 * 1024 * 1024, 'ru')).toBe('2 МБ');
    expect(formatFileSize(2 * 1024 * 1024, 'en')).toBe('2 MB');
    expect(buildTranslatedFilename('theleekfiles — копия.pdf', 'ru', 'txt')).toBe(
      'theleekfiles — копия.ru.txt'
    );
  });
});
