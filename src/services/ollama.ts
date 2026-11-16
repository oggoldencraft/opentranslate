import { detectScriptLanguageHint, getPromptLanguageName } from '../constants/languages';
import type { AppSettings } from '../types/settings';

export interface TranslateRequestOptions {
  text: string;
  settings: AppSettings;
  sourceLangOverride?: string;
  targetLangOverride?: string;
  signal?: AbortSignal;
  onStreamChunk?: (partialText: string) => void;
}

export interface TranslateResult {
  translatedText: string;
  detectedSourceLang: string | null;
}

export interface OllamaConnectionStatus {
  ok: boolean;
  models: string[];
  hasConfiguredModel: boolean;
  usedProxy: boolean;
  error?: string;
}

/**
 * Strips `<think>...</think>` reasoning blocks (closed or mid-stream unclosed)
 * and surrounding accidental code fences while preserving line breaks and formatting.
 */
export function cleanModelTranslationOutput(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, '');
  // If streaming is currently inside an unclosed <think> tag, hide the internal thought
  const unclosedIdx = cleaned.toLowerCase().lastIndexOf('<think>');
  if (unclosedIdx !== -1) {
    cleaned = cleaned.slice(0, unclosedIdx);
  }
  return cleaned.replace(/^\n+/, '').replace(/\s+$/, '');
}

/**
 * Builds the translation prompt using the customizable prompt template.
 * Always injects explicit canonical English language names (`English (en)`, `Russian (ru)`, etc.)
 * so `kaelri/qwen3.5-mt:2b` never defaults to Chinese for non-CN/EN pairs.
 */
export function buildTranslationPrompt(
  template: string,
  sourceLangCode: string,
  targetLangCode: string,
  text: string,
  detectedHintCode?: string | null
): string {
  const effectiveSourceName =
    sourceLangCode === 'auto'
      ? detectedHintCode
        ? `auto — detected as ${getPromptLanguageName(detectedHintCode)}`
        : getPromptLanguageName('auto')
      : getPromptLanguageName(sourceLangCode);

  const effectiveTargetName = getPromptLanguageName(targetLangCode);

  let rendered = template
    .replace(/\{\{\s*sourceLang\s*\}\}/g, effectiveSourceName)
    .replace(/\{\{\s*targetLang\s*\}\}/g, effectiveTargetName);

  if (/\{\{\s*text\s*\}\}/.test(rendered)) {
    rendered = rendered.replace(/\{\{\s*text\s*\}\}/g, () => text);
  } else {
    rendered = `${rendered.trim()}\n\nText:\n${text}`;
  }

  return rendered;
}

function shouldPreferRelativeProxy(settings: AppSettings): boolean {
  if (settings.useLocalProxy) return true;
  if (typeof window === 'undefined') return false;

  const pageHost = window.location.hostname;
  const isPageLocalhost =
    pageHost === 'localhost' || pageHost === '127.0.0.1' || pageHost === '[::1]';

  // When served from a remote/preview host (e.g., https://*.e2b.app), never make direct browser
  // requests to localhost/127.0.0.1 — route cleanly through the relative `/api/ollama` proxy.
  if (!isPageLocalhost) {
    try {
      const ep = new URL(settings.modelEndpoint);
      if (ep.hostname === 'localhost' || ep.hostname === '127.0.0.1' || ep.hostname === '[::1]') {
        return true;
      }
      if (window.location.protocol === 'https:' && ep.protocol === 'http:') {
        return true;
      }
    } catch {
      return true;
    }
  }

  return false;
}

async function fetchOllamaEndpoint(
  apiPath: string,
  init: RequestInit,
  settings: AppSettings
): Promise<{ response: Response; usedProxy: boolean }> {
  const normalizedBase = settings.modelEndpoint.replace(/\/+$/, '');
  const preferProxy = shouldPreferRelativeProxy(settings);

  const callProxy = async () => {
    const proxyHeaders = new Headers(init.headers || {});
    proxyHeaders.set('X-Ollama-Endpoint', normalizedBase);
    const response = await fetch(`/api/ollama${apiPath}`, {
      ...init,
      headers: proxyHeaders,
    });
    return { response, usedProxy: true };
  };

  const callDirect = async () => {
    const response = await fetch(`${normalizedBase}${apiPath}`, init);
    return { response, usedProxy: false };
  };

  if (preferProxy) {
    return callProxy();
  }

  try {
    const directRes = await callDirect();
    // Ollama returns 403 Forbidden if CORS origin is disallowed without OLLAMA_ORIGINS
    if (directRes.response.status === 403) {
      return callProxy();
    }
    return directRes;
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    // Automatic stateless proxy fallback when browser direct fetch fails due to CORS
    return callProxy();
  }
}

async function parseStreamingResponse(
  response: Response,
  onChunk?: (partialText: string) => void
): Promise<string> {
  if (!response.body) {
    const json = await response.json();
    const full = json?.message?.content ?? json?.response ?? '';
    const cleaned = cleanModelTranslationOutput(full);
    onChunk?.(cleaned);
    return cleaned;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let accumulatedRaw = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (!line) continue;

      try {
        const parsed = JSON.parse(line);
        if (parsed?.error) {
          throw new Error(String(parsed.error));
        }
        const piece = parsed?.message?.content ?? parsed?.response ?? '';
        if (piece) {
          accumulatedRaw += piece;
          onChunk?.(cleanModelTranslationOutput(accumulatedRaw));
        }
      } catch (e) {
        if (e instanceof Error && !line.startsWith('{')) {
          continue;
        }
        if (e instanceof Error && e.message && !e.message.includes('JSON')) {
          throw e;
        }
      }
    }
  }

  const remaining = buffer.trim();
  if (remaining) {
    try {
      const parsed = JSON.parse(remaining);
      if (parsed?.error) {
        throw new Error(String(parsed.error));
      }
      const piece = parsed?.message?.content ?? parsed?.response ?? '';
      if (piece) {
        accumulatedRaw += piece;
      }
    } catch (e) {
      if (e instanceof Error && !e.message.includes('JSON')) {
        throw e;
      }
    }
  }

  const finalClean = cleanModelTranslationOutput(accumulatedRaw);
  onChunk?.(finalClean);
  return finalClean;
}

export async function translateWithOllama(
  options: TranslateRequestOptions
): Promise<TranslateResult> {
  const { text, settings, sourceLangOverride, targetLangOverride, signal, onStreamChunk } = options;
  const trimmed = text.trim();
  if (!trimmed) {
    return { translatedText: '', detectedSourceLang: null };
  }

  const sourceCode = sourceLangOverride ?? settings.sourceLang;
  const targetCode = targetLangOverride ?? settings.targetLang;
  const detectedHint = sourceCode === 'auto' ? detectScriptLanguageHint(trimmed) : null;

  const prompt = buildTranslationPrompt(
    settings.promptTemplate,
    sourceCode,
    targetCode,
    text,
    detectedHint
  );

  const chatPayload = {
    model: settings.modelName,
    stream: settings.streaming,
    think: false,
    options: {
      temperature: settings.temperature,
      top_p: settings.topP,
      num_predict: settings.maxTokens,
    },
    messages: [{ role: 'user', content: prompt }],
  };

  let { response } = await fetchOllamaEndpoint(
    '/api/chat',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chatPayload),
      signal,
    },
    settings
  );

  // Fallback to /api/generate if an older Ollama server returns 404 on /api/chat
  if (response.status === 404) {
    const genRes = await fetchOllamaEndpoint(
      '/api/generate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: settings.modelName,
          prompt,
          stream: settings.streaming,
          think: false,
          options: chatPayload.options,
        }),
        signal,
      },
      settings
    );
    response = genRes.response;
  }

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson?.error) detail = String(errJson.error);
    } catch {
      // Keep status detail
    }
    throw new Error(detail);
  }

  if (settings.streaming) {
    const translatedText = await parseStreamingResponse(response, onStreamChunk);
    return { translatedText, detectedSourceLang: detectedHint };
  }

  const json = await response.json();
  if (json?.error) {
    throw new Error(String(json.error));
  }
  const content = json?.message?.content ?? json?.response ?? '';
  const translatedText = cleanModelTranslationOutput(content);
  onStreamChunk?.(translatedText);
  return { translatedText, detectedSourceLang: detectedHint };
}

export async function checkOllamaConnection(
  settings: AppSettings
): Promise<OllamaConnectionStatus> {
  try {
    const { response, usedProxy } = await fetchOllamaEndpoint(
      '/api/tags',
      { method: 'GET', headers: { Accept: 'application/json' } },
      settings
    );

    if (!response.ok) {
      let msg = `HTTP ${response.status}`;
      try {
        const err = await response.json();
        if (err?.error) msg = String(err.error);
      } catch {
        // Ignore
      }
      return {
        ok: false,
        models: [],
        hasConfiguredModel: false,
        usedProxy,
        error: msg,
      };
    }

    const data = await response.json();
    const models: string[] = Array.isArray(data?.models)
      ? data.models.map((m: { name?: string }) => String(m?.name || '')).filter(Boolean)
      : [];

    const target = settings.modelName.toLowerCase();
    const hasConfiguredModel = models.some((m) => {
      const lower = m.toLowerCase();
      return lower === target || lower.startsWith(`${target}:`);
    });

    return {
      ok: true,
      models,
      hasConfiguredModel,
      usedProxy,
    };
  } catch (err) {
    return {
      ok: false,
      models: [],
      hasConfiguredModel: false,
      usedProxy: false,
      error: err instanceof Error ? err.message : 'Connection failed',
    };
  }
}
