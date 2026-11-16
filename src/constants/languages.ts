import type { LanguageOption } from '../types/settings';

/**
 * Comprehensive world language catalog matching `layouts/languageselection.png`.
 * Sorted alphabetically by Russian display name when rendered in RU mode,
 * with explicit canonical English names always passed into `kaelri/qwen3.5-mt:2b`
 * so the model never defaults to Chinese on non-CN/EN language pairs.
 */
export const LANGUAGES: LanguageOption[] = [
  { code: 'ab', nameRu: 'абхазский', nameEn: 'Abkhaz', ocrCode: 'rus' },
  { code: 'az', nameRu: 'азербайджанский', nameEn: 'Azerbaijani', ocrCode: 'aze' },
  { code: 'sq', nameRu: 'албанский', nameEn: 'Albanian', ocrCode: 'sqi' },
  { code: 'am', nameRu: 'амхарский', nameEn: 'Amharic', ocrCode: 'amh' },
  { code: 'en', nameRu: 'английский', nameEn: 'English', ocrCode: 'eng' },
  { code: 'ar', nameRu: 'арабский', nameEn: 'Arabic', ocrCode: 'ara' },
  { code: 'hy', nameRu: 'армянский', nameEn: 'Armenian', ocrCode: 'hye' },
  { code: 'af', nameRu: 'африкаанс', nameEn: 'Afrikaans', ocrCode: 'afr' },
  { code: 'eu', nameRu: 'баскский', nameEn: 'Basque', ocrCode: 'eus' },
  { code: 'ba', nameRu: 'башкирский', nameEn: 'Bashkir', ocrCode: 'rus' },
  { code: 'be', nameRu: 'белорусский', nameEn: 'Belarusian', ocrCode: 'bel' },
  { code: 'bn', nameRu: 'бенгальский', nameEn: 'Bengali', ocrCode: 'ben' },
  { code: 'my', nameRu: 'бирманский (Мьянма)', nameEn: 'Burmese', ocrCode: 'mya' },
  { code: 'bg', nameRu: 'болгарский', nameEn: 'Bulgarian', ocrCode: 'bul' },
  { code: 'bs', nameRu: 'боснийский', nameEn: 'Bosnian', ocrCode: 'bos' },
  { code: 'cy', nameRu: 'валлийский', nameEn: 'Welsh', ocrCode: 'cym' },
  { code: 'hu', nameRu: 'венгерский', nameEn: 'Hungarian', ocrCode: 'hun' },
  { code: 'vi', nameRu: 'вьетнамский', nameEn: 'Vietnamese', ocrCode: 'vie' },
  { code: 'gl', nameRu: 'галисийский', nameEn: 'Galician', ocrCode: 'glg' },
  { code: 'el', nameRu: 'греческий', nameEn: 'Greek', ocrCode: 'ell' },
  { code: 'ka', nameRu: 'грузинский', nameEn: 'Georgian', ocrCode: 'kat' },
  { code: 'gu', nameRu: 'гуджарати', nameEn: 'Gujarati', ocrCode: 'guj' },
  { code: 'da', nameRu: 'датский', nameEn: 'Danish', ocrCode: 'dan' },
  { code: 'he', nameRu: 'иврит', nameEn: 'Hebrew', ocrCode: 'heb' },
  { code: 'yi', nameRu: 'идиш', nameEn: 'Yiddish', ocrCode: 'yid' },
  { code: 'id', nameRu: 'индонезийский', nameEn: 'Indonesian', ocrCode: 'ind' },
  { code: 'ga', nameRu: 'ирландский', nameEn: 'Irish', ocrCode: 'gle' },
  { code: 'is', nameRu: 'исландский', nameEn: 'Icelandic', ocrCode: 'isl' },
  { code: 'es', nameRu: 'испанский', nameEn: 'Spanish', ocrCode: 'spa' },
  { code: 'it', nameRu: 'итальянский', nameEn: 'Italian', ocrCode: 'ita' },
  { code: 'kk', nameRu: 'казахский', nameEn: 'Kazakh', ocrCode: 'kaz' },
  { code: 'kn', nameRu: 'каннада', nameEn: 'Kannada', ocrCode: 'kan' },
  { code: 'ca', nameRu: 'каталанский', nameEn: 'Catalan', ocrCode: 'cat' },
  { code: 'ky', nameRu: 'киргизский', nameEn: 'Kyrgyz', ocrCode: 'kir' },
  { code: 'zh-TW', nameRu: 'китайский (традиционный)', nameEn: 'Chinese (Traditional)', ocrCode: 'chi_tra' },
  { code: 'zh-CN', nameRu: 'китайский (упрощенный)', nameEn: 'Chinese (Simplified)', ocrCode: 'chi_sim' },
  { code: 'ko', nameRu: 'корейский', nameEn: 'Korean', ocrCode: 'kor' },
  { code: 'ku', nameRu: 'курдский', nameEn: 'Kurdish', ocrCode: 'eng' },
  { code: 'km', nameRu: 'кхмерский', nameEn: 'Khmer', ocrCode: 'khm' },
  { code: 'lo', nameRu: 'лаосский', nameEn: 'Lao', ocrCode: 'lao' },
  { code: 'la', nameRu: 'латинский', nameEn: 'Latin', ocrCode: 'lat' },
  { code: 'lv', nameRu: 'латышский', nameEn: 'Latvian', ocrCode: 'lav' },
  { code: 'lt', nameRu: 'литовский', nameEn: 'Lithuanian', ocrCode: 'lit' },
  { code: 'lb', nameRu: 'люксембургский', nameEn: 'Luxembourgish', ocrCode: 'deu' },
  { code: 'mk', nameRu: 'македонский', nameEn: 'Macedonian', ocrCode: 'mkd' },
  { code: 'ms', nameRu: 'малайский', nameEn: 'Malay', ocrCode: 'msa' },
  { code: 'ml', nameRu: 'малаялам', nameEn: 'Malayalam', ocrCode: 'mal' },
  { code: 'mt', nameRu: 'мальтийский', nameEn: 'Maltese', ocrCode: 'mlt' },
  { code: 'mr', nameRu: 'маратхи', nameEn: 'Marathi', ocrCode: 'mar' },
  { code: 'mn', nameRu: 'монгольский', nameEn: 'Mongolian', ocrCode: 'mon' },
  { code: 'de', nameRu: 'немецкий', nameEn: 'German', ocrCode: 'deu' },
  { code: 'ne', nameRu: 'непальский', nameEn: 'Nepali', ocrCode: 'nep' },
  { code: 'nl', nameRu: 'нидерландский', nameEn: 'Dutch', ocrCode: 'nld' },
  { code: 'no', nameRu: 'норвежский', nameEn: 'Norwegian', ocrCode: 'nor' },
  { code: 'os', nameRu: 'осетинский', nameEn: 'Ossetian', ocrCode: 'rus' },
  { code: 'pa', nameRu: 'панджаби', nameEn: 'Punjabi', ocrCode: 'pan' },
  { code: 'pl', nameRu: 'польский', nameEn: 'Polish', ocrCode: 'pol' },
  { code: 'pt-BR', nameRu: 'португальский (Бразилия)', nameEn: 'Portuguese (Brazil)', ocrCode: 'por' },
  { code: 'pt', nameRu: 'португальский (Португалия)', nameEn: 'Portuguese (Portugal)', ocrCode: 'por' },
  { code: 'ps', nameRu: 'пушту', nameEn: 'Pashto', ocrCode: 'pus' },
  { code: 'ro', nameRu: 'румынский', nameEn: 'Romanian', ocrCode: 'ron' },
  { code: 'ru', nameRu: 'русский', nameEn: 'Russian', ocrCode: 'rus' },
  { code: 'sr', nameRu: 'сербский', nameEn: 'Serbian', ocrCode: 'srp' },
  { code: 'si', nameRu: 'сингальский', nameEn: 'Sinhala', ocrCode: 'sin' },
  { code: 'sk', nameRu: 'словацкий', nameEn: 'Slovak', ocrCode: 'slk' },
  { code: 'sl', nameRu: 'словенский', nameEn: 'Slovenian', ocrCode: 'slv' },
  { code: 'sw', nameRu: 'суахили', nameEn: 'Swahili', ocrCode: 'swa' },
  { code: 'tg', nameRu: 'таджикский', nameEn: 'Tajik', ocrCode: 'tgk' },
  { code: 'th', nameRu: 'тайский', nameEn: 'Thai', ocrCode: 'tha' },
  { code: 'ta', nameRu: 'тамильский', nameEn: 'Tamil', ocrCode: 'tam' },
  { code: 'tt', nameRu: 'татарский', nameEn: 'Tatar', ocrCode: 'rus' },
  { code: 'te', nameRu: 'телугу', nameEn: 'Telugu', ocrCode: 'tel' },
  { code: 'tr', nameRu: 'турецкий', nameEn: 'Turkish', ocrCode: 'tur' },
  { code: 'tk', nameRu: 'туркменский', nameEn: 'Turkmen', ocrCode: 'eng' },
  { code: 'uz', nameRu: 'узбекский', nameEn: 'Uzbek', ocrCode: 'uzb' },
  { code: 'uk', nameRu: 'украинский', nameEn: 'Ukrainian', ocrCode: 'ukr' },
  { code: 'ur', nameRu: 'урду', nameEn: 'Urdu', ocrCode: 'urd' },
  { code: 'fa', nameRu: 'фарси', nameEn: 'Persian', ocrCode: 'fas' },
  { code: 'tl', nameRu: 'филиппинский', nameEn: 'Filipino', ocrCode: 'tgl' },
  { code: 'fi', nameRu: 'финский', nameEn: 'Finnish', ocrCode: 'fin' },
  { code: 'fr', nameRu: 'французский', nameEn: 'French', ocrCode: 'fra' },
  { code: 'hi', nameRu: 'хинди', nameEn: 'Hindi', ocrCode: 'hin' },
  { code: 'hr', nameRu: 'хорватский', nameEn: 'Croatian', ocrCode: 'hrv' },
  { code: 'ce', nameRu: 'чеченский', nameEn: 'Chechen', ocrCode: 'rus' },
  { code: 'cs', nameRu: 'чешский', nameEn: 'Czech', ocrCode: 'ces' },
  { code: 'cv', nameRu: 'чувашский', nameEn: 'Chuvash', ocrCode: 'rus' },
  { code: 'sv', nameRu: 'шведский', nameEn: 'Swedish', ocrCode: 'swe' },
  { code: 'eo', nameRu: 'эсперанто', nameEn: 'Esperanto', ocrCode: 'epo' },
  { code: 'et', nameRu: 'эстонский', nameEn: 'Estonian', ocrCode: 'est' },
  { code: 'jv', nameRu: 'яванский', nameEn: 'Javanese', ocrCode: 'jav' },
  { code: 'ja', nameRu: 'японский', nameEn: 'Japanese', ocrCode: 'jpn' },
];

export const DEFAULT_SOURCE_QUICK_LANGS = ['ru', 'en', 'de'];
export const DEFAULT_TARGET_QUICK_LANGS = ['ru', 'en', 'uk'];

export function getLanguageByCode(code: string): LanguageOption | undefined {
  return LANGUAGES.find((l) => l.code === code);
}

export function getLanguageDisplayName(code: string, uiLang: 'ru' | 'en' = 'ru'): string {
  if (code === 'auto') {
    return uiLang === 'ru' ? 'Определить язык' : 'Detect language';
  }
  const found = getLanguageByCode(code);
  if (!found) return code;
  return uiLang === 'ru' ? found.nameRu : found.nameEn;
}

/**
 * Always returns an explicit canonical English language descriptor for LLM prompts
 * so `kaelri/qwen3.5-mt:2b` never defaults to Chinese for non-CN/EN pairs.
 */
export function getPromptLanguageName(code: string): string {
  if (code === 'auto') {
    return 'auto (detect the source language automatically)';
  }
  const found = getLanguageByCode(code);
  return found ? `${found.nameEn} (${found.code})` : code;
}

/**
 * Lightweight script-based client language detector used when `sourceLang === 'auto'`
 * to label `"английский (определен автоматически)"` just like `layouts/translatedimageexample.png`
 * and pass a helpful hint while still honoring auto-detection.
 */
export function detectScriptLanguageHint(text: string): string | null {
  const sample = text.trim().slice(0, 600);
  if (!sample) return null;

  if (/[\u3040-\u30ff]/.test(sample)) return 'ja';
  if (/[\uac00-\ud7af]/.test(sample)) return 'ko';
  if (/[\u4e00-\u9fff]/.test(sample)) return 'zh-CN';
  if (/[\u0600-\u06ff]/.test(sample)) return 'ar';
  if (/[\u0590-\u05ff]/.test(sample)) return 'he';
  if (/[\u0e00-\u0e7f]/.test(sample)) return 'th';
  if (/[\u0900-\u097f]/.test(sample)) return 'hi';
  if (/[\u10a0-\u10ff]/.test(sample)) return 'ka';
  if (/[\u0530-\u058f]/.test(sample)) return 'hy';
  if (/[\u0370-\u03ff]/.test(sample)) return 'el';

  if (/[іїєґІЇЄҐ]/.test(sample)) return 'uk';
  if (/[ўЎ]/.test(sample)) return 'be';
  if (/[\u0400-\u04ff]/.test(sample)) return 'ru';

  if (/[äöüßÄÖÜ]/.test(sample)) return 'de';
  if (/[ñ¿¡]/i.test(sample)) return 'es';
  if (/[çœæàèùâêîôû]/i.test(sample)) return 'fr';
  if (/[a-zA-Z]/.test(sample)) return 'en';

  return null;
}
