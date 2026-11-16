import type { AppSettings } from '../types/settings';

export const DEFAULT_PROMPT_TEMPLATE = `You are OpenTranslate, a translation engine.
Translate the following text from {{sourceLang}} to {{targetLang}}.
Rules:
- Output ONLY the translation.
- Do not explain, annotate, transliterate, or add quotes.
- Preserve line breaks and formatting.
- If sourceLang is auto, detect it first.
Text:
{{text}}`;

export const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'dark',
  seedColor: '#00A884',
  colorVariant: 'tonalSpot',
  contrastLevel: 0,
  fontSize: 16,
  density: 'comfortable',
  layoutDensity: 'standard',
  cornerRadius: 12,
  uiLanguage: 'ru',

  sourceLang: 'auto',
  lastExplicitSourceLang: 'en',
  autoDetect: true,
  targetLang: 'ru',

  modelEndpoint: 'http://localhost:11434',
  useLocalProxy: false,
  modelName: 'kaelri/qwen3.5-mt:2b',
  temperature: 0.1,
  topP: 0.9,
  maxTokens: 2048,
  streaming: true,
  promptTemplate: DEFAULT_PROMPT_TEMPLATE,
};

export const SEED_COLOR_PRESETS: Array<{ label: string; hex: string }> = [
  { label: 'Emerald Mint (Default)', hex: '#00A884' },
  { label: 'Cool Jade', hex: '#00BFA5' },
  { label: 'Forest Sage', hex: '#2E7D6B' },
  { label: 'Teal Breeze', hex: '#00897B' },
  { label: 'Ocean Cyan', hex: '#0097A7' },
  { label: ' Cobalt Blue', hex: '#1A73E8' },
  { label: 'Iris Indigo', hex: '#5C6BC0' },
  { label: 'Warm Amber', hex: '#FFB300' },
];
