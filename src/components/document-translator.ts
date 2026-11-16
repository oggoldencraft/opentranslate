import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/filled-tonal-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import '@material/web/dialog/dialog.js';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/progress/linear-progress.js';
import { STRINGS } from '../constants/i18n';
import { detectScriptLanguageHint } from '../constants/languages';
import { parseDocumentLocally, type ParsedDocument } from '../services/document-parser';
import { translateWithOllama } from '../services/ollama';
import { sharedStyles } from '../styles/shared-styles';
import type { AppSettings } from '../types/settings';
import {
  buildTranslatedFilename,
  formatFileSize,
  splitTextIntoChunks,
  triggerBlobDownload,
} from '../utils/format';

type ReaderTab = 'translated' | 'sideBySide' | 'original';

@customElement('ot-document-translator')
export class OtDocumentTranslator extends LitElement {
  static override styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }

      .doc-card {
        position: relative;
        background: var(--md-sys-color-surface);
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: var(--ot-card-radius, 12px);
        overflow: hidden;
        transition: border-color 150ms ease, background-color 150ms ease;
      }

      .doc-card[data-dragging='true'] {
        border-color: var(--md-sys-color-primary);
        background: color-mix(in srgb, var(--md-sys-color-primary) 7%, var(--md-sys-color-surface));
      }

      /* Empty Picker State */
      .dropzone-grid {
        display: grid;
        grid-template-columns: 1fr 1px 1fr;
        min-height: 310px;
        align-items: center;
        padding: 32px 24px;
      }

      .divider-v {
        align-self: stretch;
        background: var(--md-sys-color-outline-variant);
        margin: 12px 0;
      }

      .drop-left,
      .drop-right {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 16px;
        gap: 14px;
      }

      .cloud-svg {
        width: 196px;
        height: 124px;
      }

      .drop-title {
        margin: 0;
        font-size: 1.375rem;
        font-weight: 400;
      }

      .or-label {
        margin: 0;
        font-size: 0.9375rem;
        font-weight: 500;
      }

      .formats-note {
        margin: 6px 0 0;
        font-size: 0.75rem;
        color: var(--md-sys-color-on-surface-variant);
        max-width: 320px;
      }

      /* Active Document Layout matching layouts/documentstranslationexample.png */
      .doc-stage {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 310px;
        padding: 44px 24px 28px;
        gap: 24px;
      }

      .file-banner {
        display: flex;
        align-items: center;
        gap: 16px;
        width: 100%;
        max-width: 560px;
        padding: 16px 14px 16px 20px;
        border-radius: calc(var(--ot-card-radius, 12px) * 0.9);
        background: color-mix(
          in srgb,
          var(--md-sys-color-secondary-container) 72%,
          var(--md-sys-color-surface-container)
        );
        color: var(--md-sys-color-on-secondary-container);
      }

      .file-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: var(--md-sys-color-primary);
        font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
        flex-shrink: 0;
      }

      .file-meta {
        flex: 1;
        min-width: 0;
      }

      .file-name {
        font-size: 0.9375rem;
        font-weight: 500;
        color: var(--md-sys-color-on-surface);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .file-size {
        margin-top: 2px;
        font-size: 0.8125rem;
        color: var(--md-sys-color-on-surface-variant);
      }

      .progress-box {
        width: 100%;
        max-width: 560px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .progress-box md-linear-progress {
        width: 100%;
      }

      .progress-caption {
        font-size: 0.8125rem;
        color: var(--md-sys-color-on-surface-variant);
        text-align: center;
      }

      .action-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 12px;
      }

      .error-banner {
        width: 100%;
        max-width: 560px;
        padding: 12px 16px;
        border-radius: 8px;
        background: color-mix(in srgb, var(--md-sys-color-error-container) 60%, var(--md-sys-color-surface-container));
        color: var(--md-sys-color-on-surface);
        font-size: 0.85rem;
        text-align: center;
      }

      .engine-badge {
        margin-top: 12px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--md-sys-color-primary);
      }

      .engine-badge md-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      /* Document Viewer Modal */
      md-dialog {
        --md-dialog-container-color: var(--md-sys-color-surface-container-high);
        max-width: min(1040px, 94vw);
        width: 960px;
      }

      .viewer-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 14px;
        flex-wrap: wrap;
      }

      .viewer-tab-btn {
        padding: 6px 14px;
        border-radius: var(--ot-pill-radius, 999px);
        border: 1px solid var(--md-sys-color-outline-variant);
        background: transparent;
        color: var(--md-sys-color-on-surface-variant);
        font-family: inherit;
        font-size: 0.8125rem;
        font-weight: 500;
        cursor: pointer;
      }

      .viewer-tab-btn[data-active='true'] {
        background: var(--md-sys-color-secondary-container);
        border-color: transparent;
        color: var(--md-sys-color-on-secondary-container);
      }

      .viewer-panes {
        display: grid;
        gap: 14px;
        max-height: 58vh;
        overflow-y: auto;
      }

      .viewer-panes[data-side-by-side='true'] {
        grid-template-columns: 1fr 1fr;
      }

      .doc-text-box {
        padding: 16px;
        border-radius: 10px;
        background: var(--md-sys-color-surface);
        border: 1px solid var(--md-sys-color-outline-variant);
        color: var(--md-sys-color-on-surface);
        font-size: 0.9375rem;
        line-height: 1.6;
        white-space: pre-wrap;
        word-break: break-word;
      }

      @media (max-width: 820px) {
        .dropzone-grid {
          grid-template-columns: 1fr;
        }

        .divider-v {
          width: 100%;
          height: 1px;
        }

        .viewer-panes[data-side-by-side='true'] {
          grid-template-columns: 1fr;
        }
      }
    `,
  ];

  @property({ attribute: false }) settings!: AppSettings;

  @state() private isDragging = false;
  @state() private parsedDoc: ParsedDocument | null = null;
  @state() private isParsing = false;
  @state() private parseProgress = 0;
  @state() private isTranslating = false;
  @state() private currentChunkIndex = 0;
  @state() private totalChunks = 0;
  @state() private translatedDocumentText = '';
  @state() private errorMessage: string | null = null;
  @state() private viewerOpen = false;
  @state() private readerTab: ReaderTab = 'translated';
  @state() private copiedDoc = false;

  private abortController: AbortController | null = null;

  override disconnectedCallback(): void {
    this.abortController?.abort();
    super.disconnectedCallback();
  }

  private openFilePicker(): void {
    const input = this.renderRoot.querySelector<HTMLInputElement>('#doc-file-input');
    input?.click();
  }

  private handleInputChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      void this.loadDocument(file);
    }
    input.value = '';
  }

  private handleDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      void this.loadDocument(file);
    }
  }

  private clearDocument(): void {
    this.abortController?.abort();
    this.abortController = null;
    this.parsedDoc = null;
    this.isParsing = false;
    this.isTranslating = false;
    this.translatedDocumentText = '';
    this.errorMessage = null;
    this.viewerOpen = false;
  }

  private async loadDocument(file: File): Promise<void> {
    this.clearDocument();
    this.isParsing = true;
    this.parseProgress = 0;
    this.errorMessage = null;

    try {
      const parsed = await parseDocumentLocally(file, (ratio) => {
        this.parseProgress = ratio;
      });
      this.parsedDoc = parsed;
      this.isParsing = false;

      if (parsed.text.trim()) {
        const hint =
          this.settings.sourceLang === 'auto' ? detectScriptLanguageHint(parsed.text) : null;
        this.dispatchEvent(
          new CustomEvent<string | null>('detected-language', {
            detail: hint,
            bubbles: true,
            composed: true,
          })
        );
        await this.translateParsedDocument();
      } else {
        this.errorMessage = 'No extractable text found in this document.';
      }
    } catch (err) {
      this.isParsing = false;
      this.errorMessage = err instanceof Error ? err.message : 'Failed to parse document locally';
    }
  }

  private async translateParsedDocument(): Promise<void> {
    if (!this.parsedDoc?.text.trim()) return;

    this.abortController?.abort();
    const controller = new AbortController();
    this.abortController = controller;

    const chunks = splitTextIntoChunks(this.parsedDoc.text, 1800);
    this.totalChunks = chunks.length;
    this.currentChunkIndex = 0;
    this.translatedDocumentText = '';
    this.isTranslating = true;
    this.errorMessage = null;

    const completedChunks: string[] = [];

    try {
      for (let i = 0; i < chunks.length; i++) {
        if (controller.signal.aborted) return;
        this.currentChunkIndex = i + 1;

        const res = await translateWithOllama({
          text: chunks[i],
          settings: this.settings,
          signal: controller.signal,
          onStreamChunk: (partial) => {
            this.translatedDocumentText = [...completedChunks, partial].filter(Boolean).join('\n\n');
          },
        });

        completedChunks.push(res.translatedText);
        this.translatedDocumentText = completedChunks.join('\n\n');
      }

      if (this.translatedDocumentText.trim()) {
        this.dispatchEvent(
          new CustomEvent('translation-complete', {
            detail: {
              mode: 'document',
              sourceLang: this.settings.sourceLang,
              targetLang: this.settings.targetLang,
              sourceText: `[${this.parsedDoc.fileName}] ${this.parsedDoc.text.slice(0, 300)}`,
              translatedText: this.translatedDocumentText.slice(0, 600),
            },
            bubbles: true,
            composed: true,
          })
        );
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      this.errorMessage = err instanceof Error ? err.message : 'Document translation failed';
    } finally {
      if (this.abortController === controller) {
        this.isTranslating = false;
        this.abortController = null;
      }
    }
  }

  private downloadTranslatedDoc(): void {
    if (!this.translatedDocumentText.trim() || !this.parsedDoc) return;
    const outName = buildTranslatedFilename(
      this.parsedDoc.fileName,
      this.settings.targetLang,
      'txt'
    );
    const blob = new Blob([this.translatedDocumentText], { type: 'text/plain;charset=utf-8' });
    triggerBlobDownload(blob, outName);
  }

  private async copyTranslatedDoc(): Promise<void> {
    if (!this.translatedDocumentText) return;
    try {
      await navigator.clipboard.writeText(this.translatedDocumentText);
      this.copiedDoc = true;
      setTimeout(() => {
        this.copiedDoc = false;
      }, 1500);
    } catch {
      // Ignore
    }
  }

  override render() {
    const uiLang = this.settings?.uiLanguage || 'ru';
    const t = STRINGS[uiLang];

    return html`
      <input
        id="doc-file-input"
        class="sr-only"
        type="file"
        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        @change=${this.handleInputChange}
      />

      <div
        class="doc-card"
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
        ${!this.parsedDoc && !this.isParsing
          ? html`
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
                      d="M110 52H126L138 64V98C138 101.3 135.3 104 132 104H110C106.7 104 104 101.3 104 98V58C104 54.7 106.7 52 110 52ZM124 58V67H133L124 58Z"
                      fill="var(--md-sys-color-primary)"
                    />
                  </svg>
                  <h2 class="drop-title">${t.dragAndDropTitle}</h2>
                </div>

                <div class="divider-v" aria-hidden="true"></div>

                <div class="drop-right">
                  <p class="or-label">${t.orChooseFile}</p>
                  <md-filled-button @click=${this.openFilePicker}>
                    ${t.chooseFiles}
                  </md-filled-button>
                  <p class="formats-note">${t.supportedDocumentFormats}</p>
                </div>
              </div>
              ${this.errorMessage ? html`<div class="error-banner" style="margin:0 auto 20px">${this.errorMessage}</div>` : nothing}
            `
          : html`
              <!-- Document stage matching layouts/documentstranslationexample.png -->
              <div class="doc-stage">
                ${this.parsedDoc
                  ? html`
                      <div class="file-banner">
                        <md-icon class="file-icon" aria-hidden="true">description</md-icon>
                        <div class="file-meta">
                          <div class="file-name">${this.parsedDoc.fileName}</div>
                          <div class="file-size">
                            ${formatFileSize(this.parsedDoc.fileSize, uiLang)}
                            ${this.parsedDoc.pageCount ? ` · ${this.parsedDoc.pageCount} стр.` : ''}
                          </div>
                        </div>
                        <md-icon-button
                          aria-label=${t.removeDocument}
                          title=${t.removeDocument}
                          @click=${this.clearDocument}
                        >
                          <md-icon>close</md-icon>
                        </md-icon-button>
                      </div>
                    `
                  : nothing}

                ${this.isParsing || this.isTranslating
                  ? html`
                      <div class="progress-box">
                        <md-linear-progress
                          .value=${this.isParsing
                            ? this.parseProgress
                            : this.totalChunks > 0
                              ? (this.currentChunkIndex - 0.5) / this.totalChunks
                              : 0}
                          ?indeterminate=${this.totalChunks <= 1 && this.isTranslating}
                        ></md-linear-progress>
                        <div class="progress-caption">
                          ${this.isParsing
                            ? t.parsingDocument
                            : `${t.translatingDocumentProgress} ${this.currentChunkIndex} / ${this.totalChunks}…`}
                        </div>
                      </div>
                    `
                  : nothing}

                ${this.errorMessage
                  ? html`<div class="error-banner" role="alert">${this.errorMessage}</div>`
                  : nothing}

                <div class="action-row">
                  ${this.isTranslating
                    ? html`
                        <md-outlined-button
                          @click=${() => {
                            this.abortController?.abort();
                            this.isTranslating = false;
                          }}
                        >
                          <md-icon slot="icon">stop</md-icon>
                          ${t.stopTranslation}
                        </md-outlined-button>
                      `
                    : nothing}

                  ${this.translatedDocumentText
                    ? html`
                        <md-outlined-button @click=${this.downloadTranslatedDoc}>
                          <md-icon slot="icon">download</md-icon>
                          ${t.downloadTranslation}
                        </md-outlined-button>

                        <md-filled-button
                          @click=${() => {
                            this.viewerOpen = true;
                          }}
                        >
                          <md-icon slot="icon">open_in_new</md-icon>
                          ${t.openTranslatedDocument}
                        </md-filled-button>
                      `
                    : !this.isTranslating && this.parsedDoc
                      ? html`
                          <md-filled-button @click=${() => this.translateParsedDocument()}>
                            <md-icon slot="icon">translate</md-icon>
                            ${t.translateDocument}
                          </md-filled-button>
                        `
                      : nothing}
                </div>

                <div class="engine-badge">
                  <md-icon aria-hidden="true">verified_user</md-icon>
                  <span>${t.localEngineBadge}</span>
                </div>
              </div>
            `}
      </div>

      <!-- Translated Document Viewer Dialog -->
      <md-dialog
        ?open=${this.viewerOpen}
        @closed=${() => {
          this.viewerOpen = false;
        }}
      >
        <div slot="headline">${this.parsedDoc?.fileName || t.documentViewerTitle}</div>
        <div slot="content">
          <div class="viewer-tabs" role="tablist">
            <button
              type="button"
              class="viewer-tab-btn"
              data-active=${this.readerTab === 'translated' ? 'true' : 'false'}
              @click=${() => {
                this.readerTab = 'translated';
              }}
            >
              ${t.translatedDocumentTab}
            </button>
            <button
              type="button"
              class="viewer-tab-btn"
              data-active=${this.readerTab === 'sideBySide' ? 'true' : 'false'}
              @click=${() => {
                this.readerTab = 'sideBySide';
              }}
            >
              ${t.sideBySideTab}
            </button>
            <button
              type="button"
              class="viewer-tab-btn"
              data-active=${this.readerTab === 'original' ? 'true' : 'false'}
              @click=${() => {
                this.readerTab = 'original';
              }}
            >
              ${t.originalDocumentTab}
            </button>
          </div>

          <div
            class="viewer-panes"
            data-side-by-side=${this.readerTab === 'sideBySide' ? 'true' : 'false'}
          >
            ${this.readerTab === 'original' || this.readerTab === 'sideBySide'
              ? html`<div class="doc-text-box">${this.parsedDoc?.text || ''}</div>`
              : nothing}

            ${this.readerTab === 'translated' || this.readerTab === 'sideBySide'
              ? html`<div class="doc-text-box">${this.translatedDocumentText}</div>`
              : nothing}
          </div>
        </div>
        <div slot="actions">
          <md-text-button @click=${this.copyTranslatedDoc}>
            <md-icon slot="icon">${this.copiedDoc ? 'check' : 'content_copy'}</md-icon>
            ${this.copiedDoc ? t.copied : t.copyText}
          </md-text-button>
          <md-filled-tonal-button @click=${this.downloadTranslatedDoc}>
            <md-icon slot="icon">download</md-icon>
            ${t.downloadTranslation}
          </md-filled-tonal-button>
          <md-text-button
            @click=${() => {
              this.viewerOpen = false;
            }}
          >
            ${t.closeDialog}
          </md-text-button>
        </div>
      </md-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ot-document-translator': OtDocumentTranslator;
  }
}
