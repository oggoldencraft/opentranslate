# OpenTranslate

**OpenTranslate** is a local-first, privacy-preserving Material 3 / Material You translation web application built with **Vite + TypeScript + Lit**, official **`@material/web`** components, and **`@material/material-color-utilities`** dynamic color generation.

By default, OpenTranslate connects to your local **Ollama** server (`http://localhost:11434`) running **`kaelri/qwen3.5-mt:2b`** and supports **Text (`Текст`)**, **Image (`Изображения`)**, and **Document (`Документы`)** translation entirely on your machine.

---

## Key Features

- **Three Local-First Translation Modes**
  - **Текст (Text Mode)**: Dual-pane Material 3 workspace with real-time NDJSON token streaming, auto-detect script hints, copy, clear, language swap (`⇄`), session bookmarking, and `.txt` export.
  - **Изображения (Image Mode)**: Drag-and-drop, file picker (`JPEG`, `JPG`, `PNG`, `WebP`), and clipboard paste (`Ctrl+V`). Runs **Tesseract.js WASM** locally in the browser (`cacheMethod: 'none'`) with automatic upscaling and dark-background contrast inversion, translates via `kaelri/qwen3.5-mt:2b`, paints translated text over bounding boxes on an HTML5 `<canvas>` (with `"Показать исходный текст"` toggle), and displays editable OCR + translated text alongside the image.
  - **Документы (Document Mode)**: Parses **PDF** (`pdfjs-dist`), **DOCX** (`mammoth`), and **TXT** files 100% locally in browser RAM, splits long documents into paragraph-preserving chunks, translates with live progress, and lets you download (`Скачать перевод`) or inspect in a built-in side-by-side reader (`Открыть переведенный документ`).
  - *Strict scope*: No website translation button, URL fetcher, or browser-extension UI is included.
- **Authentic Material 3 & Material You Dynamic Color**
  - Dark mode by default (`#00A884` cool emerald-mint seed color).
  - Real HCT tonal palette generation (`@material/material-color-utilities`) across 6 Material 3 scheme variants (`Tonal Spot`, `Vibrant`, `Expressive`, `Fidelity`, `Neutral`, `Monochrome`), adjustable contrast (`-0.5` to `+1.0`), font size (`13px`–`22px`), component density, layout width, and corner radius (`0px`–`28px`).
- **Cookie-Only Preference Persistence**
  - Only small UI and model settings are stored in browser cookies (`ot_settings`, `ot_prompt`).
  - `localStorage`, `sessionStorage`, and `IndexedDB` are **never** used.

---

## 1. Setup & Run Instructions

### Prerequisites
- **Node.js** `>= 20.16` (tested on Node `22.x`)
- **Ollama** installed locally ([https://ollama.com](https://ollama.com))

### Install & Start Development Server
```bash
npm install
npm run dev
```
Open `http://localhost:5173` in your browser. Both the Vite dev server and `npm start` include a built-in stateless `/api/ollama` CORS proxy if direct browser access to Ollama is blocked by CORS.

### Production Build & Stateless Server
```bash
npm run build
npm start
```
This compiles TypeScript, bundles static assets (including local offline Roboto fonts, Material Symbols, PDF.js worker, and Tesseract WASM/language data for `eng`, `rus`, `deu`, `ukr`), and serves `dist/` alongside the stateless `/api/ollama/*` stream forwarder on port `4173`.

### Run Automated Tests
```bash
npm test
```

---

## 2. Running Ollama & Pulling `kaelri/qwen3.5-mt:2b`

1. **Pull the default translation model:**
   ```bash
   ollama pull kaelri/qwen3.5-mt:2b
   ```

2. **Start Ollama locally:**
   ```bash
   ollama serve
   ```
   *(Ollama listens on `http://localhost:11434` by default.)*

3. **CORS Options (Zero-Config Proxy or Direct):**
   - **Automatic Stateless Proxy (works out of the box):** If the browser receives a CORS error from `http://localhost:11434`, OpenTranslate automatically falls back to `/api/ollama` on the local dev/production server, or you can toggle **"Use local stateless CORS proxy"** directly in **Settings → Ollama Model**.
   - **Direct Browser-to-Ollama (optional):** If you prefer direct browser requests without any local proxy hop, launch Ollama with:
     ```bash
     OLLAMA_ORIGINS="*" ollama serve
     ```

4. **Explicit Language Prompting Note:**
   Because `kaelri/qwen3.5-mt:2b` can default to Chinese if language pairs are ambiguous, OpenTranslate always injects explicit canonical English language names (e.g., `German (de)` → `Russian (ru)`) into `{{sourceLang}}` and `{{targetLang}}` inside the customizable prompt template.

---

## 3. Mapping `layouts/*.png` to the UI

Every reference image in `layouts/` was inspected and used as the visual and structural blueprint:

| Reference File | UI Component & Functional Mapping |
| --- | --- |
| `layouts/thepage.png` | **Top App Bar, Mode Pills, Language Bar & Text Mode (`<open-translate-app>`, `<ot-mode-nav>`, `<ot-language-bar>`, `<ot-text-translator>`)**: Full-width header with `OpenTranslate` title on the left and quick Theme + Settings icon buttons on the right. Centered workspace topped by **three** pill-shaped buttons (`Текст`, `Изображения`, `Документы` — each with left Material Symbol icon and right label; the 4th `"Сайты"` pill from Google Translate is intentionally omitted per spec). Dual-card Text workspace with outlined source card on the left, tonal filled `"Перевод"` card on the right, and two circular session buttons (`История`, `Сохраненные`) below. |
| `layouts/languageselection.png` | **Searchable Multi-Column Language Picker (`<ot-language-picker>`)**: Anchored dropdown card with back arrow (`←`), `"Найти языки"` search field, highlighted `"Определить язык"` option with check mark and `auto_awesome` sparkle icon, and a responsive 5-column alphabetical language grid. |
| `layouts/imagetranslatorlayout.png` | **Image Mode Dropzone (`<ot-image-translator>`)**: Split card with tonal upload cloud graphic + `"Перетащите"` on the left, vertical divider in the middle, and `"Или выберите файл"`, primary `"Выбрать файлы"`, outlined `"Вставить из буфера обмена"`, and `"Поддерживаются файлы JPEG, JPG, PNG и WebP."` on the right. |
| `layouts/originalimage.png`, `layouts/translatedimageexample.png`, `layouts/translatedimagefromgoogle.png` | **Image OCR, Canvas Overlay & Side-by-Side Translation (`<ot-image-translator>`, `src/services/ocr.ts`)**: Toolbar with `"Показать исходный текст"` `<md-switch>`, `"Скопировать текст"`, `"Скачать перевод"`, and `✕` reset button; automatic `"английский (определен автоматически)"` indicator in the language bar; `<canvas>` overlay painting locally sampled background patches and fitted translated text over detected OCR line boxes, paired alongside an editable OCR & translated text side panel. |
| `layouts/documentstranslationexample.png` | **Document Mode (`<ot-document-translator>`, `src/services/document-parser.ts`)**: Centered tonal file chip displaying document icon, filename, formatted size (e.g. `2 МБ`), and `✕` remove button, followed by outlined `"Скачать перевод"` and filled `"Открыть переведенный документ"` action buttons and a built-in Original / Translated / Side-by-Side document reader dialog. |

---

## 4. Privacy & Cookie-Only Persistence Note

- **No Server Storage or Logging:** Neither the Vite middleware (`vite.config.ts`) nor the standalone proxy (`server/proxy.mjs`) uses a database, writes files, tracks analytics/telemetry, or logs request/response bodies. Requests to `/api/ollama/*` are forwarded in memory and piped back to the client with `Cache-Control: no-store`.
- **100% Client-Side File Processing:** Image OCR (`tesseract.js` configured with `cacheMethod: 'none'`) and document parsing (`pdfjs-dist`, `mammoth`, `File.text()`) execute strictly inside browser memory.
- **Cookie-Only User Preferences:** Only UI customization and Ollama model parameters are stored in `ot_settings` and `ot_prompt` cookies (`Path=/; SameSite=Lax; Max-Age=31536000`, never `HttpOnly`, `Secure` enabled automatically on HTTPS and omitted on `localhost`). Translation inputs, outputs, images, and documents are **never** written to cookies, `localStorage`, `sessionStorage`, or `IndexedDB` (session history/saved items live strictly in volatile JS RAM and clear on tab reload). Clicking **"Сбросить настройки (очистить cookies)"** in Settings immediately expires all OpenTranslate cookies.
