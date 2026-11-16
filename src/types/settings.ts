export type TranslationMode = 'text' | 'image' | 'document';

export type ThemeMode = 'dark' | 'light' | 'system';

export type M3SchemeVariant =
  | 'tonalSpot'
  | 'vibrant'
  | 'expressive'
  | 'fidelity'
  | 'neutral'
  | 'monochrome';

export type ComponentDensity = 'compact' | 'comfortable' | 'spacious';

export type LayoutDensity = 'compact' | 'standard' | 'wide';

export type UiLanguage = 'ru' | 'en';

export interface AppSettings {
  // Appearance & Material 3 customization
  themeMode: ThemeMode;
  seedColor: string;
  colorVariant: M3SchemeVariant;
  contrastLevel: number;
  fontSize: number;
  density: ComponentDensity;
  layoutDensity: LayoutDensity;
  cornerRadius: number;
  uiLanguage: UiLanguage;

  // Language preferences
  sourceLang: string;
  lastExplicitSourceLang: string;
  autoDetect: boolean;
  targetLang: string;

  // Ollama model configuration
  modelEndpoint: string;
  useLocalProxy: boolean;
  modelName: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  streaming: boolean;
  promptTemplate: string;
}

export interface LanguageOption {
  code: string;
  nameRu: string;
  nameEn: string;
  ocrCode?: string;
}

export interface OcrLineBox {
  text: string;
  translatedText?: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface InMemoryTranslationRecord {
  id: string;
  mode: TranslationMode;
  sourceLang: string;
  targetLang: string;
  sourceText: string;
  translatedText: string;
  timestamp: number;
  saved: boolean;
}
