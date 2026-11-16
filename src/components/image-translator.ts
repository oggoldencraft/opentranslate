import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/filled-tonal-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/progress/linear-progress.js';
import '@material/web/switch/switch.js';
import { STRINGS } from '../constants/i18n';
import { detectScriptLanguageHint } from '../constants/languages';
import {
  extractImageTextLocally,
  loadImageElement,
  renderTranslatedImageCanvas,
} from '../services/ocr';
import { translateWithOllama } from '../services/ollama';
import { sharedStyles } from '../styles/shared-styles';
import type { AppSettings, OcrLineBox } from '../types/settings';
import { buildTranslatedFilename, triggerBlobDownload } from '../utils/format';

@customElement('ot-image-translator')
export class OtImageTranslator extends LitElement {
  static override styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }

      .workspace-card {
        position: relative;
        background: var(--md-sys-color-surface);
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: var(--ot-card-radius, 12px);
        overflow: hidden;
        transition: border-color 150ms ease, background-color 150ms ease;
      }

      .workspace-card[data-dragging='true'] {
        border-color: var(--md-sys-color-primary);
        background: color-mix(in srgb, var(--md-sys-color-primary) 7%, var(--md-sys-color-surface));
      }

      /* Empty Dropzone matching layouts/imagetranslatorlayout.png */
      .dropzone-grid {
        display: grid;
        grid-template-columns: 1fr 1px 1fr;
        min-height: 330px;
        align-items: center;
        padding: 32px 24px;
      }

      .divider-v {
        align-self: stretch;
        background: var(--md-sys-color-outline-variant);
        margin: 12px 0;
      }

      .drop-left {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 16px;
        gap: 18px;
      }

      .cloud-svg {
        width: 210px;
        height: 132px;
      }

      .drop-title {
        margin: 0;
        font-size: 1.375rem;
        font-weight: 400;
        color: var(--md-sys-color-on-surface);
      }

      .drop-right {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 16px 24px;
        gap: 14px;
      }

      .or-label {
        margin: 0 0 2px;
        font-size: 0.9375rem;
        font-weight: 500;
        color: var(--md-sys-color-on-surface);
      }

      .picker-buttons {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 100%;
        max-width: 256px;
      }

      .picker-buttons md-filled-button,
      .picker-buttons md-outlined-button {
        width: 100%;
      }

      .formats-note {
        margin: 8px 0 0;
        font-size: 0.75rem;
        color: var(--md-sys-color-on-surface-variant);
      }

      .inline-alert {
        margin: 0 24px 18px;
        padding: 10px 14px;
        border-radius: 8px;
        background: var(--md-sys-color-error-container);
        color: var(--md-sys-color-on-error-container);
        font-size: 0.85rem;
        text-align: center;
      }

      /* Active Image View matching layouts/translatedimageexample.png + side-by-side text */
      .image-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-height: 54px;
        padding: 8px 14px 8px 18px;
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface);
      }

      .toggle-original {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--md-sys-color-on-surface-variant);
        cursor: pointer;
      }

      .toolbar-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }

      .progress-wrap md-linear-progress {
        width: 100%;
        --md-linear-progress-track-height: 3px;
        --md-linear-progress-active-indicator-height: 3px;
      }

      .status-strip {
        padding: 8px 18px;
        font-size: 0.8125rem;
        color: var(--md-sys-color-primary);
        background: var(--md-sys-color-surface-container-low);
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
      }

      .image-body {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(300px, 0.9fr);
        min-height: 320px;
        background: var(--md-sys-color-surface-container-lowest);
      }

      .canvas-stage {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: var(--md-sys-color-surface-container-low);
        overflow: auto;
      }

      .canvas-stage canvas {
        max-width: 100%;
        max-height: 480px;
        width: auto;
        height: auto;
        border-radius: 6px;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
      }

      .side-panel {
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: 18px;
        border-left: 1px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface);
      }

      .panel-block {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .panel-label {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--md-sys-color-on-surface-variant);
      }

      .ocr-textarea {
        width: 100%;
        min-height: 100px;
        resize: vertical;
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface-container-low);
        color: var(--md-sys-color-on-surface);
        font-family: inherit;
        font-size: 0.9375rem;
        line-height: 1.45;
      }

      .translated-box {
        min-height: 120px;
        padding: 12px 14px;
        border-radius: 8px;
        background: var(--md-sys-color-surface-container);
        color: var(--md-sys-color-on-surface);
        font-size: 1rem;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .muted {
        color: var(--md-sys-color-on-surface-variant);
        font-size: 0.875rem;
      }

      @media (max-width: 900px) {
        .dropzone-grid {
          grid-template-columns: 1fr;
          gap: 12px;
          padding: 24px 16px;
        }

        .divider-v {
          height: 1px;
          width: 100%;
          margin: 4px 0;
        }

        .image-body {
          grid-template-columns: 1fr;
        }

        .side-panel {
          border-left: none;
          border-top: 1px solid var(--md-sys-color-outline-variant);
        }
      }
    `,
  ];

  @property({ attribute: false }) settings!: AppSettings;

  @state() private isDragging = false;
  @state() private fileName = '';
  @state() private objectUrl: string | null = null;
  @state() private showOriginal = false;
  @state() private isExtracting = false;
  @state() private ocrProgress = 0;
  @state() private isTranslating = false;
  @state() private extractedText = '';
  @state() private translatedText = '';
  @state() private ocrLines: OcrLineBox[] = [];
  @state() private statusError: string | null = null;
  @state() private copied = false;

  private loadedImage: HTMLImageElement | null = null;
  private abortController: AbortController | null = null;
  private lastLangSig = '';

  override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('paste', this.handleGlobalPaste);
  }

  override disconnectedCallback(): void {
    window.removeEventListener('paste', this.handleGlobalPaste);
    this.cleanupImage();
    super.disconnectedCallback();
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('settings') && this.settings) {
      const sig = `${this.settings.sourceLang}|${this.settings.targetLang}|${this.settings.modelName}`;
      if (this.lastLangSig && sig !== this.lastLangSig && this.loadedImage && this.extractedText.trim()) {
        void this.translateExtractedText();
      }
      this.lastLangSig = sig;
    }

    if (this.loadedImage) {
      this.redrawCanvas();
    }
  }

  private cleanupImage(): void {
    this.abortController?.abort();
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.loadedImage = null;
    this.fileName = '';
    this.extractedText = '';
    this.translatedText = '';
    this.ocrLines = [];
    this.statusError = null;
    this.showOriginal = false;
  }

  private handleGlobalPaste = (e: ClipboardEvent): void => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          void this.processImageFile(file);
          return;
        }
      }
    }
  };

  private async pasteFromClipboardButton(): Promise<void> {
    const t = STRINGS[this.settings.uiLanguage];
    this.statusError = null;
    try {
      if (!navigator.clipboard?.read) {
        this.statusError = t.clipboardNoImage;
        return;
      }
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imgType = item.types.find((tp) => tp.startsWith('image/'));
        if (imgType) {
          const blob = await item.getType(imgType);
          const ext = imgType.split('/')[1] || 'png';
          const file = new File([blob], `clipboard.${ext}`, { type: imgType });
          await this.processImageFile(file);
          return;
        }
      }
      this.statusError = t.clipboardNoImage;
    } catch {
      this.statusError = t.clipboardNoImage;
    }
  }

  private openFileDialog(): void {
    const input = this.renderRoot.querySelector<HTMLInputElement>('#image-file-input');
    input?.click();
  }

  private handleFileInputChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      void this.processImageFile(file);
    }
    input.value = '';
  }

  private handleDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging = false;
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      void this.processImageFile(file);
    }
  }

  private async processImageFile(file: File): Promise<void> {
    this.cleanupImage();
    this.fileName = file.name || 'image.png';
    this.objectUrl = URL.createObjectURL(file);
    this.isExtracting = true;
    this.ocrProgress = 0;
    this.statusError = null;

    try {
      const img = await loadImageElement(this.objectUrl);
      this.loadedImage = img;
      await this.updateComplete;
      this.redrawCanvas();

      const ocrResult = await extractImageTextLocally(img, this.settings.sourceLang, (p) => {
        this.ocrProgress = p;
      });

      this.ocrLines = ocrResult.lines;
      this.extractedText = ocrResult.fullText;
      this.isExtracting = false;

      if (this.extractedText.trim()) {
        const hint =
          this.settings.sourceLang === 'auto' ? detectScriptLanguageHint(this.extractedText) : null;
        this.dispatchEvent(
          new CustomEvent<string | null>('detected-language', {
            detail: hint,
            bubbles: true,
            composed: true,
          })
        );
        await this.translateExtractedText();
      }
    } catch (err) {
      this.isExtracting = false;
      this.statusError = err instanceof Error ? err.message : 'Image OCR failed';
    }
  }

  private async translateExtractedText(): Promise<void> {
    if (!this.extractedText.trim()) return;

    this.abortController?.abort();
    const controller = new AbortController();
    this.abortController = controller;
    this.isTranslating = true;
    this.statusError = null;

    const applyTranslatedLines = (text: string) => {
      this.translatedText = text;
      const split = text.split('\n');
      if (this.ocrLines.length > 0) {
        this.ocrLines = this.ocrLines.map((line, idx) => ({
          ...line,
          translatedText:
            this.ocrLines.length === 1
              ? text.replace(/\n+/g, ' ')
              : (split[idx] ?? ''),
        }));
      }
      this.redrawCanvas();
    };

    try {
      const result = await translateWithOllama({
        text: this.extractedText,
        settings: this.settings,
        signal: controller.signal,
        onStreamChunk: (partial) => {
          applyTranslatedLines(partial);
        },
      });

      if (controller.signal.aborted) return;
      applyTranslatedLines(result.translatedText);

      if (result.translatedText.trim()) {
        this.dispatchEvent(
          new CustomEvent('translation-complete', {
            detail: {
              mode: 'image',
              sourceLang: result.detectedSourceLang || this.settings.sourceLang,
              targetLang: this.settings.targetLang,
              sourceText: this.extractedText,
              translatedText: result.translatedText,
            },
            bubbles: true,
            composed: true,
          })
        );
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      this.statusError = err instanceof Error ? err.message : 'Ollama translation failed';
    } finally {
      if (this.abortController === controller) {
        this.isTranslating = false;
        this.abortController = null;
      }
    }
  }

  private redrawCanvas(): void {
    const canvas = this.renderRoot.querySelector<HTMLCanvasElement>('#translated-canvas');
    if (!canvas || !this.loadedImage) return;
    renderTranslatedImageCanvas(canvas, this.loadedImage, this.ocrLines, this.showOriginal);
  }

  private async copyTranslated(): Promise<void> {
    const textToCopy = this.translatedText || this.extractedText;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 1500);
    } catch {
      // Ignore
    }
  }

  private downloadResult(): void {
    const canvas = this.renderRoot.querySelector<HTMLCanvasElement>('#translated-canvas');
    if (canvas && this.loadedImage) {
      canvas.toBlob((blob) => {
        if (blob) {
          const outName = buildTranslatedFilename(
            this.fileName || 'image.png',
            this.settings.targetLang,
            'png'
          );
          triggerBlobDownload(blob, outName);
        }
      }, 'image/png');
      return;
    }

    if (this.translatedText) {
      const blob = new Blob([this.translatedText], { type: 'text/plain;charset=utf-8' });
      triggerBlobDownload(blob, `image.${this.settings.targetLang}.txt`);
    }
  }

  override render() {
    const t = STRINGS[this.settings?.uiLanguage || 'ru'];

    return html`
      <input
        id="image-file-input"
        class="sr-only"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        @change=${this.handleFileInputChange}
      />

      <div
        class="workspace-card"
        data-dragging=${this.isDragging ? 'true' : 'false'}
        @dragover=${(e: DragEvent) => {
          e.preventDefault();
          this.isDragging = true;
        }}
        @dragleave=${() => {
          this.isDragging = false;
        }}
        @drop=${this.handleDrop}
      >
        ${!this.objectUrl
          ? html`
              <!-- Empty Dropzone matching layouts/imagetranslatorlayout.png -->
              <div class="dropzone-grid">
                <div class="drop-left">
                  <svg
                    class="cloud-svg"
                    viewBox="0 0 240 150"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M188 130H60C35.7 130 16 110.3 16 86C16 63.8 32.4 45.5 53.8 42.5C63.6 22.1 84.5 8 108.8 8C140.4 8 166.5 32.1 169.6 62.9C172.3 62.3 175.1 62 178 62C199 62 216 79 216 100C216 116.8 204.2 130 188 130Z"
                      fill="var(--md-sys-color-secondary-container)"
                    />
                    <path
                      d="M120 58L104 74H115V96H125V74H136L120 58ZM98 102V110H142V102H98Z"
                      fill="var(--md-sys-color-primary)"
                    />
                  </svg>
                  <h2 class="drop-title">${t.dragAndDropTitle}</h2>
                </div>

                <div class="divider-v" aria-hidden="true"></div>

                <div class="drop-right">
                  <p class="or-label">${t.orChooseFile}</p>
                  <div class="picker-buttons">
                    <md-filled-button @click=${this.openFileDialog}>
                      ${t.chooseFiles}
                    </md-filled-button>

                    <md-outlined-button @click=${this.pasteFromClipboardButton}>
                      <md-icon slot="icon">content_paste</md-icon>
                      ${t.pasteFromClipboard}
                    </md-outlined-button>
                  </div>
                  <p class="formats-note">${t.supportedImageFormats}</p>
                </div>
              </div>

              ${this.statusError ? html`<div class="inline-alert">${this.statusError}</div>` : nothing}
            `
          : html`
              <!-- Loaded Image & Translation View matching layouts/translatedimageexample.png -->
              <div class="image-toolbar">
                <label class="toggle-original">
                  <span>${t.showOriginalText}</span>
                  <md-switch
                    aria-label=${t.showOriginalText}
                    ?selected=${this.showOriginal}
                    @change=${(e: Event) => {
                      const sw = e.target as HTMLElement & { selected: boolean };
                      this.showOriginal = Boolean(sw.selected);
                      this.redrawCanvas();
                    }}
                  ></md-switch>
                </label>

                <div class="toolbar-actions">
                  <md-text-button
                    ?disabled=${!this.translatedText && !this.extractedText}
                    @click=${this.copyTranslated}
                  >
                    <md-icon slot="icon">${this.copied ? 'check' : 'content_copy'}</md-icon>
                    ${this.copied ? t.copied : t.copyText}
                  </md-text-button>

                  <md-text-button @click=${this.downloadResult}>
                    <md-icon slot="icon">download</md-icon>
                    ${t.downloadTranslation}
                  </md-text-button>

                  <md-icon-button
                    aria-label=${t.closeImage}
                    title=${t.closeImage}
                    @click=${() => {
                      this.cleanupImage();
                      this.dispatchEvent(
                        new CustomEvent<string | null>('detected-language', {
                          detail: null,
                          bubbles: true,
                          composed: true,
                        })
                      );
                    }}
                  >
                    <md-icon>close</md-icon>
                  </md-icon-button>
                </div>
              </div>

              ${this.isExtracting || this.isTranslating
                ? html`
                    <div class="progress-wrap">
                      <md-linear-progress
                        ?indeterminate=${this.isTranslating || this.ocrProgress <= 0}
                        .value=${this.isExtracting ? this.ocrProgress : 0}
                      ></md-linear-progress>
                    </div>
                    <div class="status-strip">
                      ${this.isExtracting
                        ? `${t.extractingImageText} ${Math.round(this.ocrProgress * 100)}%`
                        : t.translatingImageText}
                    </div>
                  `
                : nothing}

              <div class="image-body">
                <div class="canvas-stage">
                  <canvas id="translated-canvas" aria-label=${this.fileName}></canvas>
                </div>

                <aside class="side-panel">
                  <div class="panel-block">
                    <div class="panel-header">
                      <span class="panel-label">${t.extractedTextHeading}</span>
                      <md-filled-tonal-button
                        ?disabled=${this.isExtracting || this.isTranslating || !this.extractedText.trim()}
                        @click=${() => this.translateExtractedText()}
                      >
                        <md-icon slot="icon">translate</md-icon>
                        ${t.retranslateEditedOcr}
                      </md-filled-tonal-button>
                    </div>
                    <textarea
                      class="ocr-textarea"
                      .value=${this.extractedText}
                      placeholder=${t.noTextDetectedInImage}
                      aria-label=${t.extractedTextHeading}
                      @input=${(e: Event) => {
                        this.extractedText = (e.target as HTMLTextAreaElement).value;
                      }}
                    ></textarea>
                  </div>

                  <div class="panel-block">
                    <span class="panel-label">${t.translatedTextHeading}</span>
                    ${this.statusError
                      ? html`<div class="inline-alert" style="margin:0">${this.statusError}</div>`
                      : html`
                          <div class="translated-box">
                            ${this.translatedText
                              ? this.translatedText
                              : html`<span class="muted">
                                  ${this.isTranslating
                                    ? t.translatingImageText
                                    : !this.extractedText && !this.isExtracting
                                      ? t.noTextDetectedInImage
                                      : t.translationPlaceholder}
                                </span>`}
                          </div>
                        `}
                  </div>
                </aside>
              </div>
            `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ot-image-translator': OtImageTranslator;
  }
}
