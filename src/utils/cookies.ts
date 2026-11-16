import { DEFAULT_PROMPT_TEMPLATE, DEFAULT_SETTINGS } from '../constants/defaults';
import type {
  AppSettings,
  ComponentDensity,
  LayoutDensity,
  M3SchemeVariant,
  ThemeMode,
  UiLanguage,
} from '../types/settings';

export const SETTINGS_COOKIE_NAME = 'ot_settings';
export const PROMPT_COOKIE_NAME = 'ot_prompt';
export const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 365 days

const VALID_THEMES: ThemeMode[] = ['dark', 'light', 'system'];
const VALID_VARIANTS: M3SchemeVariant[] = [
  'tonalSpot',
  'vibrant',
  'expressive',
  'fidelity',
  'neutral',
  'monochrome',
];
const VALID_DENSITIES: ComponentDensity[] = ['compact', 'comfortable', 'spacious'];
const VALID_LAYOUTS: LayoutDensity[] = ['compact', 'standard', 'wide'];
const VALID_UI_LANGS: UiLanguage[] = ['ru', 'en'];

function shouldUseSecureFlag(loc?: Pick<Location, 'protocol' | 'hostname'>): boolean {
  const current = loc ?? (typeof window !== 'undefined' ? window.location : undefined);
  if (!current) return false;
  if (current.hostname === 'localhost' || current.hostname === '127.0.0.1' || current.hostname === '[::1]') {
    return false;
  }
  return current.protocol === 'https:';
}

export function formatCookieHeader(
  name: string,
  encodedValue: string,
  maxAgeSeconds: number = COOKIE_MAX_AGE_SECONDS,
  loc?: Pick<Location, 'protocol' | 'hostname'>
): string {
  const parts = [
    `${name}=${encodedValue}`,
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (shouldUseSecureFlag(loc)) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

export function parseCookieMap(cookieString: string): Record<string, string> {
  const map: Record<string, string> = {};
  if (!cookieString) return map;

  for (const rawPair of cookieString.split(';')) {
    const trimmed = rawPair.trim();
    if (!trimmed) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    map[key] = val;
  }
  return map;
}

function clampNumber(val: unknown, min: number, max: number, fallback: number): number {
  const n = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function normalizeHex(val: unknown, fallback: string): string {
  if (typeof val !== 'string') return fallback;
  const cleaned = val.trim();
  return /^#[0-9a-fA-F]{6}$/.test(cleaned) ? cleaned.toUpperCase() : fallback;
}

export function sanitizeSettings(partial: Partial<AppSettings>): AppSettings {
  const themeMode = VALID_THEMES.includes(partial.themeMode as ThemeMode)
    ? (partial.themeMode as ThemeMode)
    : DEFAULT_SETTINGS.themeMode;

  const colorVariant = VALID_VARIANTS.includes(partial.colorVariant as M3SchemeVariant)
    ? (partial.colorVariant as M3SchemeVariant)
    : DEFAULT_SETTINGS.colorVariant;

  const density = VALID_DENSITIES.includes(partial.density as ComponentDensity)
    ? (partial.density as ComponentDensity)
    : DEFAULT_SETTINGS.density;

  const layoutDensity = VALID_LAYOUTS.includes(partial.layoutDensity as LayoutDensity)
    ? (partial.layoutDensity as LayoutDensity)
    : DEFAULT_SETTINGS.layoutDensity;

  const uiLanguage = VALID_UI_LANGS.includes(partial.uiLanguage as UiLanguage)
    ? (partial.uiLanguage as UiLanguage)
    : DEFAULT_SETTINGS.uiLanguage;

  const sourceLang =
    typeof partial.sourceLang === 'string' && partial.sourceLang.trim()
      ? partial.sourceLang.trim().slice(0, 16)
      : DEFAULT_SETTINGS.sourceLang;

  const lastExplicitSourceLang =
    typeof partial.lastExplicitSourceLang === 'string' &&
    partial.lastExplicitSourceLang.trim() &&
    partial.lastExplicitSourceLang !== 'auto'
      ? partial.lastExplicitSourceLang.trim().slice(0, 16)
      : DEFAULT_SETTINGS.lastExplicitSourceLang;

  const targetLang =
    typeof partial.targetLang === 'string' &&
    partial.targetLang.trim() &&
    partial.targetLang !== 'auto'
      ? partial.targetLang.trim().slice(0, 16)
      : DEFAULT_SETTINGS.targetLang;

  const modelEndpoint =
    typeof partial.modelEndpoint === 'string' && partial.modelEndpoint.trim()
      ? partial.modelEndpoint.trim().replace(/\/+$/, '').slice(0, 200)
      : DEFAULT_SETTINGS.modelEndpoint;

  const modelName =
    typeof partial.modelName === 'string' && partial.modelName.trim()
      ? partial.modelName.trim().slice(0, 120)
      : DEFAULT_SETTINGS.modelName;

  const promptTemplate =
    typeof partial.promptTemplate === 'string' && partial.promptTemplate.trim()
      ? partial.promptTemplate.slice(0, 2400)
      : DEFAULT_PROMPT_TEMPLATE;

  return {
    themeMode,
    seedColor: normalizeHex(partial.seedColor, DEFAULT_SETTINGS.seedColor),
    colorVariant,
    contrastLevel: clampNumber(partial.contrastLevel, -0.5, 1.0, DEFAULT_SETTINGS.contrastLevel),
    fontSize: clampNumber(partial.fontSize, 13, 22, DEFAULT_SETTINGS.fontSize),
    density,
    layoutDensity,
    cornerRadius: clampNumber(partial.cornerRadius, 0, 28, DEFAULT_SETTINGS.cornerRadius),
    uiLanguage,
    sourceLang,
    lastExplicitSourceLang,
    autoDetect: typeof partial.autoDetect === 'boolean' ? partial.autoDetect : sourceLang === 'auto',
    targetLang,
    modelEndpoint,
    useLocalProxy:
      typeof partial.useLocalProxy === 'boolean'
        ? partial.useLocalProxy
        : DEFAULT_SETTINGS.useLocalProxy,
    modelName,
    temperature: clampNumber(partial.temperature, 0, 2, DEFAULT_SETTINGS.temperature),
    topP: clampNumber(partial.topP, 0, 1, DEFAULT_SETTINGS.topP),
    maxTokens: Math.round(clampNumber(partial.maxTokens, 64, 16384, DEFAULT_SETTINGS.maxTokens)),
    streaming:
      typeof partial.streaming === 'boolean' ? partial.streaming : DEFAULT_SETTINGS.streaming,
    promptTemplate,
  };
}

/**
 * Reads user preferences strictly from `document.cookie` (or supplied cookie string for tests).
 * Never touches localStorage, sessionStorage, or IndexedDB.
 */
export function loadSettingsFromCookies(rawCookieStr?: string): AppSettings {
  const source =
    rawCookieStr !== undefined
      ? rawCookieStr
      : typeof document !== 'undefined'
        ? document.cookie
        : '';

  const map = parseCookieMap(source);
  let parsedCore: Partial<AppSettings> = {};

  if (map[SETTINGS_COOKIE_NAME]) {
    try {
      const json = decodeURIComponent(map[SETTINGS_COOKIE_NAME]);
      const data = JSON.parse(json);
      if (data && typeof data === 'object') {
        parsedCore = data as Partial<AppSettings>;
      }
    } catch {
      parsedCore = {};
    }
  }

  if (map[PROMPT_COOKIE_NAME]) {
    try {
      const decodedPrompt = decodeURIComponent(map[PROMPT_COOKIE_NAME]);
      const parsedPrompt = JSON.parse(decodedPrompt);
      if (typeof parsedPrompt === 'string') {
        parsedCore.promptTemplate = parsedPrompt;
      }
    } catch {
      // Ignore malformed prompt cookie and fall back to default
    }
  }

  return sanitizeSettings(parsedCore);
}

/**
 * Saves user preferences strictly in browser cookies (`ot_settings` and `ot_prompt`).
 * Never stores translation text, images, or documents.
 */
export function saveSettingsToCookies(
  settings: AppSettings,
  loc?: Pick<Location, 'protocol' | 'hostname'>
): AppSettings {
  const clean = sanitizeSettings(settings);
  if (typeof document === 'undefined') return clean;

  // Exclude promptTemplate from compact settings JSON so each cookie stays well below 4 KB
  const { promptTemplate, ...coreSettings } = clean;
  const encodedCore = encodeURIComponent(JSON.stringify(coreSettings));
  document.cookie = formatCookieHeader(SETTINGS_COOKIE_NAME, encodedCore, COOKIE_MAX_AGE_SECONDS, loc);

  if (promptTemplate === DEFAULT_PROMPT_TEMPLATE) {
    // Clear custom prompt cookie if using default prompt
    document.cookie = formatCookieHeader(PROMPT_COOKIE_NAME, '', 0, loc);
  } else {
    const encodedPrompt = encodeURIComponent(JSON.stringify(promptTemplate));
    document.cookie = formatCookieHeader(PROMPT_COOKIE_NAME, encodedPrompt, COOKIE_MAX_AGE_SECONDS, loc);
  }

  return clean;
}

/**
 * Clears all OpenTranslate cookies (`ot_*`) and returns fresh default settings.
 */
export function clearOpenTranslateCookies(loc?: Pick<Location, 'protocol' | 'hostname'>): AppSettings {
  if (typeof document !== 'undefined') {
    const existing = parseCookieMap(document.cookie);
    for (const key of Object.keys(existing)) {
      if (key.startsWith('ot_')) {
        document.cookie = formatCookieHeader(key, '', 0, loc);
      }
    }
    document.cookie = formatCookieHeader(SETTINGS_COOKIE_NAME, '', 0, loc);
    document.cookie = formatCookieHeader(PROMPT_COOKIE_NAME, '', 0, loc);
  }
  return { ...DEFAULT_SETTINGS };
}
