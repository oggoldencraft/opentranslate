import type { Page } from 'tesseract.js';
import { getLanguageByCode } from '../constants/languages';
import type { OcrLineBox } from '../types/settings';

const BUNDLED_OCR_LANGS = new Set(['eng', 'rus', 'deu', 'ukr']);

export interface OcrExtractionResult {
  fullText: string;
  lines: OcrLineBox[];
  imageWidth: number;
  imageHeight: number;
}

function resolveTesseractLangs(sourceLangCode: string): { langs: string; useLocalTessdata: boolean } {
  if (sourceLangCode === 'auto') {
    return { langs: 'eng+rus', useLocalTessdata: true };
  }
  const langInfo = getLanguageByCode(sourceLangCode);
  const ocrCode = langInfo?.ocrCode || 'eng';
  if (BUNDLED_OCR_LANGS.has(ocrCode)) {
    const combo = ocrCode === 'eng' ? 'eng' : `${ocrCode}+eng`;
    return { langs: combo, useLocalTessdata: true };
  }
  return { langs: ocrCode, useLocalTessdata: false };
}

export function loadImageElement(srcUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode image in browser'));
    img.src = srcUrl;
  });
}

/**
 * Builds preprocessed canvases for local OCR:
 * - Upscales small images (e.g. memes, UI snippets) up to ~2.5x so Tesseract achieves high accuracy.
 * - Detects dark-background images (mean luminance < 95) and prepares an inverted high-contrast pass.
 */
function prepareOcrCanvases(img: HTMLImageElement): {
  primaryCanvas: HTMLCanvasElement;
  fallbackCanvas: HTMLCanvasElement | null;
  scale: number;
} {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const minDim = Math.min(w, h);
  const maxDim = Math.max(w, h);

  let scale = 1;
  if (minDim < 500 && maxDim * 2.5 <= 2400) {
    scale = 2.5;
  } else if (minDim < 800 && maxDim * 1.75 <= 2400) {
    scale = 1.75;
  }

  const targetW = Math.max(1, Math.round(w * scale));
  const targetH = Math.max(1, Math.round(h * scale));

  const baseCanvas = document.createElement('canvas');
  baseCanvas.width = targetW;
  baseCanvas.height = targetH;
  const baseCtx = baseCanvas.getContext('2d', { willReadFrequently: true });
  if (!baseCtx) {
    return { primaryCanvas: baseCanvas, fallbackCanvas: null, scale };
  }
  baseCtx.imageSmoothingEnabled = true;
  baseCtx.imageSmoothingQuality = 'high';
  baseCtx.drawImage(img, 0, 0, targetW, targetH);

  const imgData = baseCtx.getImageData(0, 0, targetW, targetH);
  const data = imgData.data;
  let lumSum = 0;
  const step = Math.max(4, Math.floor(data.length / 16000) * 4);
  let samples = 0;
  for (let i = 0; i < data.length; i += step) {
    lumSum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    samples++;
  }
  const avgLum = samples > 0 ? lumSum / samples : 128;

  if (avgLum < 105) {
    // Dark background image (like `layouts/originalimage.png`): build inverted contrast-enhanced canvas
    const invCanvas = document.createElement('canvas');
    invCanvas.width = targetW;
    invCanvas.height = targetH;
    const invCtx = invCanvas.getContext('2d');
    if (invCtx) {
      const invImg = invCtx.createImageData(targetW, targetH);
      const dst = invImg.data;
      for (let i = 0; i < data.length; i += 4) {
        // Max channel highlights colored words ("yes" in green, "no" in red, white text) against dark bg
        const maxCh = Math.max(data[i], data[i + 1], data[i + 2]);
        const boosted = Math.min(255, Math.max(0, (maxCh - 35) * 1.45));
        const inverted = 255 - boosted;
        dst[i] = inverted;
        dst[i + 1] = inverted;
        dst[i + 2] = inverted;
        dst[i + 3] = 255;
      }
      invCtx.putImageData(invImg, 0, 0);
      return { primaryCanvas: invCanvas, fallbackCanvas: baseCanvas, scale };
    }
  }

  return { primaryCanvas: baseCanvas, fallbackCanvas: null, scale };
}

function extractLinesFromPage(page: Page, scale: number): OcrLineBox[] {
  const lines: OcrLineBox[] = [];
  if (!page.blocks) return lines;

  for (const block of page.blocks) {
    for (const para of block.paragraphs || []) {
      for (const line of para.lines || []) {
        const cleaned = (line.text || '').replace(/\s+/g, ' ').trim();
        if (!cleaned) continue;
        // Filter 1-char low-confidence edge artifacts
        if (cleaned.length === 1 && (line.confidence ?? 0) < 55 && !/[a-zA-Zа-яА-Я0-9]/.test(cleaned)) {
          continue;
        }
        if ((line.confidence ?? 0) < 28 && cleaned.length <= 2) {
          continue;
        }
        lines.push({
          text: cleaned,
          confidence: line.confidence ?? 0,
          bbox: {
            x0: Math.round(line.bbox.x0 / scale),
            y0: Math.round(line.bbox.y0 / scale),
            x1: Math.round(line.bbox.x1 / scale),
            y1: Math.round(line.bbox.y1 / scale),
          },
        });
      }
    }
  }
  return lines;
}

/**
 * Extracts text & line bounding boxes 100% locally in the browser using Tesseract.js WASM.
 * Uses `cacheMethod: 'none'` so nothing is stored in IndexedDB.
 */
export async function extractImageTextLocally(
  imageElement: HTMLImageElement,
  sourceLangCode: string,
  onProgress?: (progress: number) => void
): Promise<OcrExtractionResult> {
  const { langs, useLocalTessdata } = resolveTesseractLangs(sourceLangCode);
  const { primaryCanvas, fallbackCanvas, scale } = prepareOcrCanvases(imageElement);
  const { createWorker } = await import('tesseract.js');

  const worker = await createWorker(langs, 1, {
    workerPath: '/ocr-assets/worker.min.js',
    corePath: '/ocr-assets/core',
    ...(useLocalTessdata ? { langPath: '/ocr-assets/tessdata' } : {}),
    cacheMethod: 'none',
    logger: (msg) => {
      if (msg.status === 'recognizing text' && typeof msg.progress === 'number') {
        onProgress?.(msg.progress);
      }
    },
  });

  try {
    let result = await worker.recognize(primaryCanvas, {}, { text: true, blocks: true });
    let lines = extractLinesFromPage(result.data, scale);

    if (lines.length === 0 && fallbackCanvas) {
      result = await worker.recognize(fallbackCanvas, {}, { text: true, blocks: true });
      lines = extractLinesFromPage(result.data, scale);
    }

    const fullText =
      lines.length > 0
        ? lines.map((l) => l.text).join('\n')
        : (result.data.text || '').trim();

    return {
      fullText,
      lines,
      imageWidth: imageElement.naturalWidth || imageElement.width,
      imageHeight: imageElement.naturalHeight || imageElement.height,
    };
  } finally {
    await worker.terminate();
  }
}

/**
 * Renders the image onto a `<canvas>` and, when `showOriginal` is false,
 * paints locally sampled inpainted backdrops + translated lines over detected bounding boxes
 * matching `layouts/translatedimageexample.png` & `layouts/translatedimagefromgoogle.png`.
 */
export function renderTranslatedImageCanvas(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  lines: OcrLineBox[],
  showOriginal: boolean
): void {
  const w = image.naturalWidth || image.width;
  const h = image.naturalHeight || image.height;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(image, 0, 0, w, h);

  if (showOriginal || lines.length === 0) {
    return;
  }

  for (const line of lines) {
    const translated = line.translatedText?.trim();
    if (!translated) continue;

    const padX = Math.max(4, Math.round((line.bbox.x1 - line.bbox.x0) * 0.04));
    const padY = Math.max(2, Math.round((line.bbox.y1 - line.bbox.y0) * 0.08));
    const x = Math.max(0, line.bbox.x0 - padX);
    const y = Math.max(0, line.bbox.y0 - padY);
    const boxW = Math.min(w - x, line.bbox.x1 - line.bbox.x0 + padX * 2);
    const boxH = Math.min(h - y, line.bbox.y1 - line.bbox.y0 + padY * 2);
    if (boxW <= 4 || boxH <= 4) continue;

    // Sample perimeter pixels to estimate local background & foreground colors
    const patch = ctx.getImageData(x, y, boxW, boxH).data;
    let rBg = 0;
    let gBg = 0;
    let bBg = 0;
    let countBg = 0;

    for (let px = 0; px < boxW; px += 2) {
      const topIdx = px * 4;
      const botIdx = ((boxH - 1) * boxW + px) * 4;
      rBg += patch[topIdx] + patch[botIdx];
      gBg += patch[topIdx + 1] + patch[botIdx + 1];
      bBg += patch[topIdx + 2] + patch[botIdx + 2];
      countBg += 2;
    }
    for (let py = 0; py < boxH; py += 2) {
      const leftIdx = py * boxW * 4;
      const rightIdx = (py * boxW + (boxW - 1)) * 4;
      rBg += patch[leftIdx] + patch[rightIdx];
      gBg += patch[leftIdx + 1] + patch[rightIdx + 1];
      bBg += patch[leftIdx + 2] + patch[rightIdx + 2];
      countBg += 2;
    }

    const avgR = countBg > 0 ? Math.round(rBg / countBg) : 24;
    const avgG = countBg > 0 ? Math.round(gBg / countBg) : 24;
    const avgB = countBg > 0 ? Math.round(bBg / countBg) : 24;
    const bgLum = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;

    ctx.save();
    ctx.fillStyle = `rgba(${avgR}, ${avgG}, ${avgB}, 0.92)`;
    const radius = Math.min(8, Math.round(boxH * 0.22));
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, radius);
    ctx.fill();

    // Auto-fit font size so the translated line fits cleanly inside boxW
    let fontSize = Math.max(11, Math.round((line.bbox.y1 - line.bbox.y0) * 0.82));
    ctx.font = `600 ${fontSize}px Roboto, system-ui, sans-serif`;
    while (fontSize > 10 && ctx.measureText(translated).width > boxW - 6) {
      fontSize -= 1;
      ctx.font = `600 ${fontSize}px Roboto, system-ui, sans-serif`;
    }

    ctx.fillStyle = bgLum < 135 ? '#F5F7F6' : '#141817';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(translated, x + boxW / 2, y + boxH / 2, boxW - 4);
    ctx.restore();
  }
}
