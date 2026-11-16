import type { UiLanguage } from '../types/settings';

export interface UiStrings {
  // Modes — Requirement #3: three pill-shaped buttons: "Текст", "Изображения", "Документы"
  modeText: string;
  modeImages: string;
  modeDocuments: string;

  // Language bar & picker
  detectLanguage: string;
  detectedAutoSuffix: string;
  swapLanguages: string;
  moreSourceLanguages: string;
  moreTargetLanguages: string;
  searchLanguages: string;
  noLanguagesFound: string;

  // Text mode (`layouts/thepage.png`)
  sourcePlaceholder: string;
  translationPlaceholder: string;
  translating: string;
  clearText: string;
  copySource: string;
  copyTranslation: string;
  copied: string;
  translateNow: string;
  stopTranslation: string;
  saveTranslation: string;
  unsaveTranslation: string;
  downloadTranslationTxt: string;

  // Image mode (`layouts/imagetranslatorlayout.png` & `translatedimageexample.png`)
  dragAndDropTitle: string;
  orChooseFile: string;
  chooseFiles: string;
  pasteFromClipboard: string;
  supportedImageFormats: string;
  showOriginalText: string;
  copyText: string;
  downloadTranslation: string;
  closeImage: string;
  extractingImageText: string;
  translatingImageText: string;
  extractedTextHeading: string;
  translatedTextHeading: string;
  retranslateEditedOcr: string;
  noTextDetectedInImage: string;
  clipboardNoImage: string;

  // Document mode (`layouts/documentstranslationexample.png`)
  supportedDocumentFormats: string;
  translateDocument: string;
  openTranslatedDocument: string;
  removeDocument: string;
  parsingDocument: string;
  translatingDocumentProgress: string;
  localEngineBadge: string;
  documentViewerTitle: string;
  originalDocumentTab: string;
  translatedDocumentTab: string;
  sideBySideTab: string;

  // Bottom quick actions (`layouts/thepage.png`)
  history: string;
  saved: string;
  inMemorySessionNotice: string;
  emptyHistory: string;
  emptySaved: string;
  clearSessionHistory: string;

  // App bar & Settings
  toggleTheme: string;
  openSettings: string;
  settingsTitle: string;
  settingsSubtitle: string;
  tabAppearance: string;
  tabModel: string;
  tabLanguagesPrompt: string;
  themeLabel: string;
  themeDark: string;
  themeLight: string;
  themeSystem: string;
  accentColorLabel: string;
  customHexLabel: string;
  schemeVariantLabel: string;
  contrastLevelLabel: string;
  fontSizeLabel: string;
  componentDensityLabel: string;
  layoutDensityLabel: string;
  cornerRadiusLabel: string;
  uiLanguageLabel: string;
  densityCompact: string;
  densityComfortable: string;
  densitySpacious: string;
  layoutCompact: string;
  layoutStandard: string;
  layoutWide: string;
  endpointLabel: string;
  useProxyLabel: string;
  useProxyDescription: string;
  modelNameLabel: string;
  temperatureLabel: string;
  topPLabel: string;
  maxTokensLabel: string;
  streamingLabel: string;
  streamingDescription: string;
  testConnection: string;
  testingConnection: string;
  connectionOk: string;
  connectionFailed: string;
  autoDetectToggleLabel: string;
  defaultSourceLabel: string;
  defaultTargetLabel: string;
  promptTemplateLabel: string;
  promptTemplateHint: string;
  restoreDefaultPrompt: string;
  resetAllSettings: string;
  resetConfirmDone: string;
  closeDialog: string;
  cookiePrivacyNote: string;
}

export const STRINGS: Record<UiLanguage, UiStrings> = {
  ru: {
    modeText: 'Текст',
    modeImages: 'Изображения',
    modeDocuments: 'Документы',

    detectLanguage: 'Определить язык',
    detectedAutoSuffix: '(определен автоматически)',
    swapLanguages: 'Поменять языки местами',
    moreSourceLanguages: 'Все исходные языки',
    moreTargetLanguages: 'Все языки перевода',
    searchLanguages: 'Найти языки',
    noLanguagesFound: 'Языки не найдены',

    sourcePlaceholder: 'Введите текст',
    translationPlaceholder: 'Перевод',
    translating: 'Переводим локально через Ollama…',
    clearText: 'Очистить текст',
    copySource: 'Скопировать исходный текст',
    copyTranslation: 'Скопировать перевод',
    copied: 'Скопировано в буфер обмена',
    translateNow: 'Перевести',
    stopTranslation: 'Остановить',
    saveTranslation: 'Сохранить в текущей сессии',
    unsaveTranslation: 'Удалить из сохраненных',
    downloadTranslationTxt: 'Скачать .txt',

    dragAndDropTitle: 'Перетащите',
    orChooseFile: 'Или выберите файл',
    chooseFiles: 'Выбрать файлы',
    pasteFromClipboard: 'Вставить из буфера обмена',
    supportedImageFormats: 'Поддерживаются файлы JPEG, JPG, PNG и WebP.',
    showOriginalText: 'Показать исходный текст',
    copyText: 'Скопировать текст',
    downloadTranslation: 'Скачать перевод',
    closeImage: 'Закрыть изображение',
    extractingImageText: 'Локальное распознавание текста (OCR в браузере)…',
    translatingImageText: 'Перевод текста изображения через Qwen…',
    extractedTextHeading: 'Распознанный текст (OCR)',
    translatedTextHeading: 'Перевод',
    retranslateEditedOcr: 'Перевести заново',
    noTextDetectedInImage: 'На изображении не удалось распознать текст. Вы можете ввести текст вручную справа.',
    clipboardNoImage: 'В буфере обмена не найдено изображение (JPEG, PNG или WebP).',

    supportedDocumentFormats: 'Поддерживаются файлы PDF, DOCX и TXT (обработка 100% локально в браузере).',
    translateDocument: 'Перевести документ',
    openTranslatedDocument: 'Открыть переведенный документ',
    removeDocument: 'Удалить выбранный документ',
    parsingDocument: 'Локальное чтение документа в браузере…',
    translatingDocumentProgress: 'Перевод фрагмента',
    localEngineBadge: 'Локальный перевод OpenTranslate · без отправки на внешние серверы',
    documentViewerTitle: 'Переведенный документ',
    originalDocumentTab: 'Оригинал',
    translatedDocumentTab: 'Перевод',
    sideBySideTab: 'Рядом',

    history: 'История',
    saved: 'Сохраненные',
    inMemorySessionNotice: 'Хранится только в оперативной памяти вкладки. При закрытии страницы очищается.',
    emptyHistory: 'История текущей сессии пуста.',
    emptySaved: 'Нет сохраненных переводов в текущей сессии.',
    clearSessionHistory: 'Очистить память сессии',

    toggleTheme: 'Переключить тему оформления',
    openSettings: 'Настройки и кастомизация OpenTranslate',
    settingsTitle: 'Настройки OpenTranslate',
    settingsSubtitle: 'Material You кастомизация и параметры локальной модели Ollama (сохраняются только в cookies)',
    tabAppearance: 'Оформление',
    tabModel: 'Модель Ollama',
    tabLanguagesPrompt: 'Языки и промпт',
    themeLabel: 'Тема оформления',
    themeDark: 'Тёмная (по умолчанию)',
    themeLight: 'Светлая',
    themeSystem: 'Системная',
    accentColorLabel: 'Акцентный цвет Material You (Seed)',
    customHexLabel: 'Свой HEX',
    schemeVariantLabel: 'Палитра Material 3',
    contrastLevelLabel: 'Контрастность',
    fontSizeLabel: 'Размер шрифта',
    componentDensityLabel: 'Плотность элементов',
    layoutDensityLabel: 'Ширина и отступы макета',
    cornerRadiusLabel: 'Скругление углов',
    uiLanguageLabel: 'Язык интерфейса (кнопки режимов всегда по макету)',
    densityCompact: 'Компактная',
    densityComfortable: 'Стандартная',
    densitySpacious: 'Свободная',
    layoutCompact: 'Узкий',
    layoutStandard: 'Стандартный',
    layoutWide: 'Широкий',
    endpointLabel: 'Локальный адрес Ollama',
    useProxyLabel: 'Использовать локальный stateless CORS-прокси (/api/ollama)',
    useProxyDescription: 'Включите при ошибке CORS в браузере. Прокси только пересылает поток и ничего не логирует.',
    modelNameLabel: 'Имя модели Ollama',
    temperatureLabel: 'Температура (Temperature)',
    topPLabel: 'Top P',
    maxTokensLabel: 'Макс. токенов (num_predict)',
    streamingLabel: 'Потоковый вывод (Streaming)',
    streamingDescription: 'Отображать перевод по мере генерации токенов моделью',
    testConnection: 'Проверить соединение с Ollama',
    testingConnection: 'Проверка…',
    connectionOk: 'Соединение с Ollama установлено',
    connectionFailed: 'Не удалось подключиться к Ollama',
    autoDetectToggleLabel: 'Автоопределение исходного языка по умолчанию',
    defaultSourceLabel: 'Исходный язык',
    defaultTargetLabel: 'Язык перевода',
    promptTemplateLabel: 'Шаблон системного промпта перевода',
    promptTemplateHint: 'Доступные переменные: {{sourceLang}}, {{targetLang}}, {{text}}',
    restoreDefaultPrompt: 'Вернуть стандартный промпт',
    resetAllSettings: 'Сбросить настройки (очистить cookies)',
    resetConfirmDone: 'Все cookies OpenTranslate удалены, настройки сброшены.',
    closeDialog: 'Готово',
    cookiePrivacyNote: 'Приватность: настройки хранятся исключительно в cookies браузера. Тексты, изображения и документы никогда не сохраняются.',
  },
  en: {
    // Keep exact three pill labels available; Requirement #3 specifies "Текст", "Изображения", "Документы"
    modeText: 'Текст',
    modeImages: 'Изображения',
    modeDocuments: 'Документы',

    detectLanguage: 'Detect language',
    detectedAutoSuffix: '(detected)',
    swapLanguages: 'Swap languages',
    moreSourceLanguages: 'More source languages',
    moreTargetLanguages: 'More target languages',
    searchLanguages: 'Search languages',
    noLanguagesFound: 'No languages found',

    sourcePlaceholder: 'Enter text',
    translationPlaceholder: 'Translation',
    translating: 'Translating locally via Ollama…',
    clearText: 'Clear text',
    copySource: 'Copy source text',
    copyTranslation: 'Copy translation',
    copied: 'Copied to clipboard',
    translateNow: 'Translate',
    stopTranslation: 'Stop',
    saveTranslation: 'Save in current session',
    unsaveTranslation: 'Remove from saved',
    downloadTranslationTxt: 'Download .txt',

    dragAndDropTitle: 'Drag and drop',
    orChooseFile: 'Or choose a file',
    chooseFiles: 'Browse your files',
    pasteFromClipboard: 'Paste from clipboard',
    supportedImageFormats: 'Supported file types: JPEG, JPG, PNG, WebP.',
    showOriginalText: 'Show original text',
    copyText: 'Copy text',
    downloadTranslation: 'Download translation',
    closeImage: 'Close image',
    extractingImageText: 'Extracting text locally in browser (OCR)…',
    translatingImageText: 'Translating extracted text via Qwen…',
    extractedTextHeading: 'Extracted text (OCR)',
    translatedTextHeading: 'Translation',
    retranslateEditedOcr: 'Re-translate',
    noTextDetectedInImage: 'No text was detected in this image. You can enter or edit text manually on the right.',
    clipboardNoImage: 'No image (JPEG, PNG, or WebP) found in clipboard.',

    supportedDocumentFormats: 'Supported file types: PDF, DOCX, TXT (parsed 100% locally in browser).',
    translateDocument: 'Translate document',
    openTranslatedDocument: 'Open translated document',
    removeDocument: 'Remove document',
    parsingDocument: 'Parsing document locally in browser…',
    translatingDocumentProgress: 'Translating section',
    localEngineBadge: 'OpenTranslate Local Engine · zero server storage',
    documentViewerTitle: 'Translated document',
    originalDocumentTab: 'Original',
    translatedDocumentTab: 'Translated',
    sideBySideTab: 'Side-by-side',

    history: 'History',
    saved: 'Saved',
    inMemorySessionNotice: 'Kept strictly in browser tab RAM. Cleared automatically on reload or close.',
    emptyHistory: 'No translations in this session yet.',
    emptySaved: 'No saved translations in this session.',
    clearSessionHistory: 'Clear session memory',

    toggleTheme: 'Toggle color theme',
    openSettings: 'OpenTranslate settings & customization',
    settingsTitle: 'OpenTranslate Settings',
    settingsSubtitle: 'Material You dynamic theming & local Ollama configuration (stored in cookies only)',
    tabAppearance: 'Appearance',
    tabModel: 'Ollama Model',
    tabLanguagesPrompt: 'Languages & Prompt',
    themeLabel: 'Theme mode',
    themeDark: 'Dark (default)',
    themeLight: 'Light',
    themeSystem: 'System',
    accentColorLabel: 'Material You Seed Accent Color',
    customHexLabel: 'Custom HEX',
    schemeVariantLabel: 'Material 3 Scheme Variant',
    contrastLevelLabel: 'Contrast level',
    fontSizeLabel: 'Font size',
    componentDensityLabel: 'Component density',
    layoutDensityLabel: 'Layout density',
    cornerRadiusLabel: 'Corner radius',
    uiLanguageLabel: 'Interface language (mode pills keep reference labels)',
    densityCompact: 'Compact',
    densityComfortable: 'Comfortable',
    densitySpacious: 'Spacious',
    layoutCompact: 'Compact',
    layoutStandard: 'Standard',
    layoutWide: 'Wide',
    endpointLabel: 'Local Ollama endpoint',
    useProxyLabel: 'Use local stateless CORS proxy (/api/ollama)',
    useProxyDescription: 'Enable if direct browser access is blocked by CORS. Forwards streams with zero logging.',
    modelNameLabel: 'Ollama model name',
    temperatureLabel: 'Temperature',
    topPLabel: 'Top P',
    maxTokensLabel: 'Max tokens (num_predict)',
    streamingLabel: 'Streaming output',
    streamingDescription: 'Stream translated tokens in real time as they are generated',
    testConnection: 'Test Ollama connection',
    testingConnection: 'Testing…',
    connectionOk: 'Connected to Ollama',
    connectionFailed: 'Could not reach Ollama',
    autoDetectToggleLabel: 'Auto-detect source language by default',
    defaultSourceLabel: 'Source language',
    defaultTargetLabel: 'Target language',
    promptTemplateLabel: 'Translation prompt template',
    promptTemplateHint: 'Placeholders: {{sourceLang}}, {{targetLang}}, {{text}}',
    restoreDefaultPrompt: 'Restore default prompt',
    resetAllSettings: 'Reset settings (clear cookies)',
    resetConfirmDone: 'All OpenTranslate cookies cleared and defaults restored.',
    closeDialog: 'Done',
    cookiePrivacyNote: 'Privacy: preferences are persisted in browser cookies only. Translation content is never stored.',
  },
};
