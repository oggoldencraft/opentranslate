import type { UiLanguage } from '../types/settings';

export function formatFileSize(bytes: number, uiLang: UiLanguage = 'ru'): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  const unitsRu = ['Б', 'КБ', 'МБ', 'ГБ'];
  const unitsEn = ['B', 'KB', 'MB', 'GB'];
  const units = uiLang === 'ru' ? unitsRu : unitsEn;

  if (bytes < 1024) return `${bytes} ${units[0]}`;
  let idx = 0;
  let value = bytes;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx++;
  }
  const formatted = value >= 10 || Number.isInteger(value) ? Math.round(value).toString() : value.toFixed(1);
  return `${formatted} ${units[idx]}`;
}

/**
 * Splits long document text into paragraph-preserving chunks so local models
 * such as `kaelri/qwen3.5-mt:2b` translate multi-page documents reliably without truncation.
 */
export function splitTextIntoChunks(text: string, maxChars: number = 1800): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];
  if (normalized.length <= maxChars) return [normalized];

  const paragraphs = normalized.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = '';

  const flushCurrent = () => {
    if (current.trim()) {
      chunks.push(current.trim());
    }
    current = '';
  };

  for (const para of paragraphs) {
    const p = para.trim();
    if (!p) continue;

    if (p.length > maxChars) {
      flushCurrent();
      // Split oversized paragraph along sentence or line boundaries
      const lines = p.split(/(?<=[.!?。！？\n])\s+/);
      let sub = '';
      for (const line of lines) {
        if (!sub) {
          if (line.length > maxChars) {
            for (let i = 0; i < line.length; i += maxChars) {
              chunks.push(line.slice(i, i + maxChars));
            }
          } else {
            sub = line;
          }
        } else if (sub.length + 1 + line.length <= maxChars) {
          sub += ` ${line}`;
        } else {
          chunks.push(sub);
          sub = line;
        }
      }
      if (sub) chunks.push(sub);
      continue;
    }

    if (!current) {
      current = p;
    } else if (current.length + 2 + p.length <= maxChars) {
      current += `\n\n${p}`;
    } else {
      flushCurrent();
      current = p;
    }
  }

  flushCurrent();
  return chunks;
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function buildTranslatedFilename(originalName: string, targetLang: string, newExt: string): string {
  const dotIdx = originalName.lastIndexOf('.');
  const base = dotIdx > 0 ? originalName.slice(0, dotIdx) : originalName;
  const safeBase = base.replace(/[<>:"/\\|?*]+/g, '_').trim() || 'document';
  return `${safeBase}.${targetLang}.${newExt.replace(/^\./, '')}`;
}
