# OpenTranslate

**OpenTranslate** is a local-first, privacy-preserving Material 3 / Material You translation web application built with **Vite + TypeScript + Lit**, official **`@material/web`** components, and **`@material/material-color-utilities`** dynamic color generation.

By default, OpenTranslate binds to **`0.0.0.0`** for effortless **Local & LAN (Wi-Fi / Ethernet)** access, connects to your local **Ollama** instance (`http://localhost:11434`) running **`kaelri/qwen3.5-mt:2b`**, and supports **Text (`Текст`)**, **Image (`Изображения`)**, and **Document (`Документы`)** translation with zero server storage.

---

## Key Features

- **Three Local-First Translation Modes**
  - **Текст (Text Mode)**: Dual-pane Material 3 workspace with real-time NDJSON token streaming, auto-detect script hints, copy (with HTTP LAN fallback), clear, language swap (`⇄`), RAM-only session bookmarking, and `.txt` export.
  - **Изображения (Image Mode)**: Drag-and-drop, file picker (`JPEG`, `JPG`, `PNG`, `WebP`), and clipboard paste (`Ctrl+V`). Runs **Tesseract.js WASM** locally in the browser (`cacheMethod: 'none'`) with automatic upscaling and dark-background contrast inversion, translates via `kaelri/qwen3.5-mt:2b`, paints translated text over bounding boxes on an HTML5 `<canvas>` (with `"Показать исходный текст"` toggle), and displays editable OCR + translated text alongside the image.
  - **Документы (Document Mode)**: Parses **PDF** (`pdfjs-dist`), **DOCX** (`mammoth`), and **TXT** files 100% locally in browser RAM, splits long documents into paragraph-preserving chunks, translates with live progress, and lets you download (`Скачать перевод`) or inspect in a built-in side-by-side reader (`Открыть переведенный документ`).
  - *Strict scope*: No website translation button, URL fetcher, or browser-extension UI is included.
- **Built-In `0.0.0.0` LAN Support**
  - Both `npm run dev` (`0.0.0.0:5173`) and `npm start` / `npm run start:lan` (`0.0.0.0:4173`) bind to `0.0.0.0` out of the box and print your LAN URLs (`http://192.168.x.x:...`).
  - Phones, tablets, and other PCs on your Wi-Fi automatically route translation streams through OpenTranslate's stateless `/api/ollama` forwarder to your host machine's Ollama — no cloud accounts, no logging, and no database.
- **Authentic Material 3 & Material You Dynamic Color**
  - Dark mode by default (`#00A884` cool emerald-mint seed color).
  - Real HCT tonal palette generation (`@material/material-color-utilities`) across 6 Material 3 scheme variants (`Tonal Spot`, `Vibrant`, `Expressive`, `Fidelity`, `Neutral`, `Monochrome`), adjustable contrast (`-0.5` to `+1.0`), font size (`13px`–`22px`), component density, layout width, and corner radius (`0px`–`28px`).
- **Cookie-Only Preference Persistence**
  - Only small UI and model settings are stored in browser cookies (`ot_settings`, `ot_prompt`).
  - `localStorage`, `sessionStorage`, and `IndexedDB` are **never** used.

---

## Complete Step-by-Step Tutorial: Clone, Setup, Run on `0.0.0.0` (LAN), and Use

Follow this guide from scratch on **Linux**, **macOS**, or **Windows**.

### Step 0 — Install Prerequisites

Install these three tools on the host computer that will run OpenTranslate and Ollama:

1. **Git** — [https://git-scm.com/downloads](https://git-scm.com/downloads)
2. **Node.js (`v20.16+` or `v22+` LTS)** — [https://nodejs.org](https://nodejs.org) *(includes `npm`)*
3. **Ollama** — [https://ollama.com/download](https://ollama.com/download)
   - *Linux one-liner*: `curl -fsSL https://ollama.com/install.sh | sh`

Verify all three are available in your terminal / PowerShell:

```bash
git --version
node -v
npm -v
ollama --version
```

---

### Step 1 — Clone the Repository

Open your terminal (or PowerShell on Windows) and clone OpenTranslate:

```bash
git clone https://github.com/oggoldencraft/opentranslate.git
cd opentranslate
```

---

### Step 2 — Install Project Dependencies

Install all frontend, Material 3, PDF/DOCX, and offline OCR packages locally:

```bash
npm install
```

*(Optional: verify TypeScript and run the automated test suite to confirm a clean install)*:

```bash
npm run typecheck
npm test
```

---

### Step 3 — Pull `kaelri/qwen3.5-mt:2b` & Start Ollama

1. **Download the default translation model** (~1.5–2 GB):
   ```bash
   ollama pull kaelri/qwen3.5-mt:2b
   ```

2. **Start the Ollama server** (choose **Option 3A** or **Option 3B**):

   #### Option 3A — Recommended: Standard Local Ollama + OpenTranslate LAN Proxy
   Keep Ollama listening on `127.0.0.1:11434` on your host computer:
   ```bash
   ollama serve
   ```
   *(Note: On macOS and Windows, if the Ollama desktop tray app is running, `ollama serve` is already active in the background. When other devices on your LAN open OpenTranslate via `http://<YOUR_LAN_IP>:5173` or `:4173`, OpenTranslate automatically forwards `/api/ollama` streams to your host's `127.0.0.1:11434` without exposing raw port `11434`.)*

   #### Option 3B — Optional: Bind Ollama Directly to `0.0.0.0:11434` on LAN
   If you *also* want the raw Ollama API (`:11434`) reachable directly from other LAN machines:
   - **Linux / macOS**:
     ```bash
     OLLAMA_HOST="0.0.0.0:11434" OLLAMA_ORIGINS="*" ollama serve
     ```
   - **Linux (`systemd` service override)**:
     ```bash
     sudo systemctl edit ollama.service
     # Add under [Service]:
     # Environment="OLLAMA_HOST=0.0.0.0:11434"
     # Environment="OLLAMA_ORIGINS=*"
     sudo systemctl daemon-reload && sudo systemctl restart ollama
     ```
   - **Windows (PowerShell)**:
     ```powershell
     $env:OLLAMA_HOST="0.0.0.0:11434"
     $env:OLLAMA_ORIGINS="*"
     ollama serve
     ```

   #### Prompt Note for `kaelri/qwen3.5-mt:2b`
   Because `kaelri/qwen3.5-mt:2b` can default to Chinese if language names are omitted, OpenTranslate always injects explicit canonical English language names (e.g., `German (de)` → `Russian (ru)`) into `{{sourceLang}}` and `{{targetLang}}`.

---

### Step 4 — Start OpenTranslate on `0.0.0.0` (Local + LAN)

Open a second terminal inside the `opentranslate` folder and choose either **Development Mode** or **Production Mode**:

#### Mode A — Development Server (`0.0.0.0:5173`, hot reload)
```bash
npm run dev
```
You will see output like:
```text
  VITE v6.x  ready in 130 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.42:5173/
```

#### Mode B — Production Build + Stateless LAN Server (`0.0.0.0:4173`, recommended for daily LAN use)
```bash
npm run start:lan
```
*(Or run the two steps separately: `npm run build` followed by `npm start`.)*

The server binds to `0.0.0.0:4173` and prints all detected LAN URLs automatically:
```text
OpenTranslate stateless server bound to 0.0.0.0:4173
  ➜  Local:   http://localhost:4173/
  ➜  LAN:     http://192.168.1.42:4173/
```

**Custom Host / Port / Upstream Ollama Options:**
```bash
# Custom port via CLI flags
node server/proxy.mjs --host 0.0.0.0 --port 8080

# Custom port or remote Ollama host via environment variables (Linux / macOS)
HOST=0.0.0.0 PORT=8080 OLLAMA_ENDPOINT=http://127.0.0.1:11434 npm start

# Windows PowerShell
$env:HOST="0.0.0.0"; $env:PORT="8080"; npm start
```

---

### Step 5 — Access OpenTranslate from Any Device on Your LAN / Wi-Fi

1. **Check your host computer's LAN IPv4 address** (printed in the terminal on startup, or via command line):
   - **Linux**: `hostname -I` or `ip -4 addr show`
   - **macOS**: `ipconfig getifaddr en0`
   - **Windows**: `ipconfig` *(look for **IPv4 Address**, e.g. `192.168.1.42`)*

2. **Allow the port through your host firewall (if blocked on LAN)**:
   - **Linux (`ufw`)**:
     ```bash
     # Allow dev (5173) or production (4173) from local private networks
     sudo ufw allow from 192.168.0.0/16 to any port 5173 proto tcp
     sudo ufw allow from 192.168.0.0/16 to any port 4173 proto tcp
     ```
   - **Windows Defender Firewall (Admin PowerShell)**:
     ```powershell
     New-NetFirewallRule -DisplayName "OpenTranslate LAN" -Direction Inbound -LocalPort 5173,4173 -Protocol TCP -Action Allow -Profile Private
     ```
   - **macOS**: Accept the *"Allow incoming network connections for node?"* prompt when starting the server (or check **System Settings → Network → Firewall**).

3. **Open in any browser on your LAN**:
   - On the **host computer**: `http://localhost:5173` (dev) or `http://localhost:4173` (prod)
   - On **any phone, tablet, or laptop on the same Wi-Fi/LAN**: `http://192.168.1.42:5173` (dev) or `http://192.168.1.42:4173` (prod) *(replace `192.168.1.42` with your host's LAN IP)*.

---

### Step 6 — Using & Customizing OpenTranslate

- **Switch Modes**: Click the three top pills — **Текст** (Text), **Изображения** (Images), or **Документы** (Documents).
- **Translate Images**: Drag & drop an image, pick a `.jpg`/`.png`/`.webp` file, or press `Ctrl+V` to paste from clipboard. Toggle **Показать исходный текст** to compare original vs. overlaid canvas translation, or edit OCR text on the right and click **Перевести заново**.
- **Translate Documents**: Drop or select a `.pdf`, `.docx`, or `.txt` file. Click **Скачать перевод** to save the translated `.txt`, or **Открыть переведенный документ** to read side-by-side.
- **Customize Theme & Model**: Click the **⚙ Settings** gear icon in the top-right app bar to customize:
  - Theme (`Dark`, `Light`, `System`), Material You Seed Color (`#00A884` default + presets + custom HEX), Scheme Variant, Contrast, Font Size, Component/Layout Density, and Corner Radius.
  - Ollama Endpoint, Stateless Proxy toggle, Model Name, Temperature, Top P, Max Tokens, Streaming toggle, and System Prompt Template.
  - Click **Сбросить настройки (очистить cookies)** at any time to wipe all OpenTranslate cookies and restore defaults.

---

### Step 7 — Troubleshooting

| Symptom | Fix |
| --- | --- |
| **`Local Ollama instance is unreachable`** | Ensure Ollama is running (`ollama serve`) on the host machine, then click **Проверить соединение с Ollama** in **Settings → Модель Ollama**. |
| **`model 'kaelri/qwen3.5-mt:2b' not found`** | Run `ollama pull kaelri/qwen3.5-mt:2b` on the host machine. |
| **Phone/laptop on Wi-Fi times out loading `http://<LAN_IP>:4173`** | Confirm both devices are on the same Wi-Fi/subnet (not Guest Wi-Fi with AP client isolation) and allow port `4173`/`5173` in your host OS firewall (see Step 5). |
| **CORS error in browser console** | Enable **Использовать локальный stateless CORS-прокси (`/api/ollama`)** in **Settings → Модель Ollama** or start Ollama with `OLLAMA_ORIGINS="*"`. |

---

## Mapping `layouts/*.png` to the UI

Every reference image in `layouts/` was inspected and used as the visual and structural blueprint:

| Reference File | UI Component & Functional Mapping |
| --- | --- |
| `layouts/thepage.png` | **Top App Bar, Mode Pills, Language Bar & Text Mode (`<open-translate-app>`, `<ot-mode-nav>`, `<ot-language-bar>`, `<ot-text-translator>`)**: Full-width header with `OpenTranslate` title on the left and quick Theme + Settings icon buttons on the right. Centered workspace topped by **three** pill-shaped buttons (`Текст`, `Изображения`, `Документы` — each with left Material Symbol icon and right label; the 4th `"Сайты"` pill from Google Translate is intentionally omitted per spec). Dual-card Text workspace with outlined source card on the left, tonal filled `"Перевод"` card on the right, and two circular session buttons (`История`, `Сохраненные`) below. |
| `layouts/languageselection.png` | **Searchable Multi-Column Language Picker (`<ot-language-picker>`)**: Anchored dropdown card with back arrow (`←`), `"Найти языки"` search field, highlighted `"Определить язык"` option with check mark and `auto_awesome` sparkle icon, and a responsive 5-column alphabetical language grid. |
| `layouts/imagetranslatorlayout.png` | **Image Mode Dropzone (`<ot-image-translator>`)**: Split card with tonal upload cloud graphic + `"Перетащите"` on the left, vertical divider in the middle, and `"Или выберите файл"`, primary `"Выбрать файлы"`, outlined `"Вставить из буфера обмена"`, and `"Поддерживаются файлы JPEG, JPG, PNG и WebP."` on the right. |
| `layouts/originalimage.png`, `layouts/translatedimageexample.png`, `layouts/translatedimagefromgoogle.png` | **Image OCR, Canvas Overlay & Side-by-Side Translation (`<ot-image-translator>`, `src/services/ocr.ts`)**: Toolbar with `"Показать исходный текст"` `<md-switch>`, `"Скопировать текст"`, `"Скачать перевод"`, and `✕` reset button; automatic `"английский (определен автоматически)"` indicator in the language bar; `<canvas>` overlay painting locally sampled background patches and fitted translated text over detected OCR line boxes, paired alongside an editable OCR & translated text side panel. |
| `layouts/documentstranslationexample.png` | **Document Mode (`<ot-document-translator>`, `src/services/document-parser.ts`)**: Centered tonal file chip displaying document icon, filename, formatted size (e.g. `2 МБ`), and `✕` remove button, followed by outlined `"Скачать перевод"` and filled `"Открыть переведенный документ"` action buttons and a built-in Original / Translated / Side-by-Side document reader dialog. |

---

## Privacy & Cookie-Only Persistence Note

- **No Server Storage or Logging:** Neither the Vite middleware (`vite.config.ts`) nor the standalone LAN server/proxy (`server/proxy.mjs`) uses a database, writes files, tracks analytics/telemetry, or logs request/response bodies. Requests to `/api/ollama/*` are forwarded in memory and piped back to the client with `Cache-Control: no-store`.
- **100% Client-Side File Processing:** Image OCR (`tesseract.js` configured with `cacheMethod: 'none'`) and document parsing (`pdfjs-dist`, `mammoth`, `File.text()`) execute strictly inside browser memory on the client device.
- **Cookie-Only User Preferences:** Only UI customization and Ollama model parameters are stored in `ot_settings` and `ot_prompt` cookies (`Path=/; SameSite=Lax; Max-Age=31536000`, never `HttpOnly`, `Secure` enabled automatically on HTTPS and omitted on HTTP `localhost` / LAN IPs). Translation inputs, outputs, images, and documents are **never** written to cookies, `localStorage`, `sessionStorage`, or `IndexedDB` (session history/saved items live strictly in volatile JS RAM and clear on tab reload). Clicking **"Сбросить настройки (очистить cookies)"** in Settings immediately expires all OpenTranslate cookies.
