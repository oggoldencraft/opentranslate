export interface ParsedDocument {
  fileName: string;
  fileSize: number;
  extension: 'pdf' | 'docx' | 'txt';
  pageCount?: number;
  text: string;
}

export function detectDocumentExtension(file: File): 'pdf' | 'docx' | 'txt' | null {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.pdf') || file.type === 'application/pdf') return 'pdf';
  if (
    lower.endsWith('.docx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'docx';
  }
  if (
    lower.endsWith('.txt') ||
    lower.endsWith('.md') ||
    file.type.startsWith('text/')
  ) {
    return 'txt';
  }
  return null;
}

async function extractPdfTextLocally(
  arrayBuffer: ArrayBuffer,
  onProgress?: (ratio: number) => void
): Promise<{ text: string; pageCount: number }> {
  const [pdfjsLib, pdfWorkerMod] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerMod.default;

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    let lastY: number | null = null;
    let currentLine = '';
    const lines: string[] = [];

    for (const item of content.items) {
      if (!('str' in item)) continue;
      const y = Array.isArray(item.transform) ? Number(item.transform[5]) : null;
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) {
        if (currentLine.trim()) lines.push(currentLine.trim());
        currentLine = item.str;
      } else {
        currentLine += (currentLine && !currentLine.endsWith(' ') && item.str ? ' ' : '') + item.str;
      }
      if (y !== null) lastY = y;
    }
    if (currentLine.trim()) lines.push(currentLine.trim());

    if (lines.length > 0) {
      pageTexts.push(lines.join('\n'));
    }
    onProgress?.(pageNum / pageCount);
  }

  return {
    text: pageTexts.join('\n\n'),
    pageCount,
  };
}

/**
 * Parses PDF, DOCX, or TXT files 100% locally in browser memory.
 * Zero network calls, zero server uploads, zero storage.
 */
export async function parseDocumentLocally(
  file: File,
  onProgress?: (ratio: number) => void
): Promise<ParsedDocument> {
  const ext = detectDocumentExtension(file);
  if (!ext) {
    throw new Error('Unsupported document format. Please select a PDF, DOCX, or TXT file.');
  }

  if (ext === 'txt') {
    const text = await file.text();
    onProgress?.(1);
    return {
      fileName: file.name,
      fileSize: file.size,
      extension: 'txt',
      text,
    };
  }

  const buffer = await file.arrayBuffer();

  if (ext === 'docx') {
    const mammothMod = await import('mammoth');
    const mammoth = mammothMod.default ?? mammothMod;
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    onProgress?.(1);
    return {
      fileName: file.name,
      fileSize: file.size,
      extension: 'docx',
      text: result.value || '',
    };
  }

  const { text, pageCount } = await extractPdfTextLocally(buffer, onProgress);
  return {
    fileName: file.name,
    fileSize: file.size,
    extension: 'pdf',
    pageCount,
    text,
  };
}
