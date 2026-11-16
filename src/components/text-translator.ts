import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@material/web/button/filled-tonal-button.js';
import '@material/web/button/text-button.js';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/progress/linear-progress.js';
import { STRINGS } from '../constants/i18n';
import { detectScriptLanguageHint } from '../constants/languages';
import { translateWithOllama } from '../services/ollama';
import { sharedStyles } from '../styles/shared-styles';
import type { AppSettings } from '../types/settings';
import { triggerBlobDownload } from '../utils/format';

@customElement('ot-text-translator')
export class OtTextTranslator extends LitElement {
  static override styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }

      .panes {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--ot-workspace-gap, 12px);
        align-items: stretch;
      }

      .card {
        position: relative;
        display: flex;
        flex-direction: column;
        min-height: 220px;
        border-radius: var(--ot-card-radius, 12px);
        overflow: hidden;
      }

      .source-card {
        background: var(--md-sys-color-surface);
        border: 1px solid var(--md-sys-color-outline-variant);
        transition: border-color 150ms ease, box-shadow 150ms ease;
      }

      .source-card:focus-within {
        border-color: var(--md-sys-color-primary);
      }

      .target-card {
        background: var(--md-sys-color-surface-container);
        border: 1px solid transparent;
      }

      .progress-slot {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        z-index: 2;
      }

      .progress-slot md-linear-progress {
        width: 100%;
        --md-linear-progress-track-height: 3px;
        --md-linear-progress-active-indicator-height: 3px;
      }

      .editor-wrap {
        position: relative;
        flex: 1;
        display: flex;
        padding: 18px 48px 10px 20px;
      }

      .source-textarea {
        width: 100%;
        min-height: 146px;
        resize: none;
        border: none;
        background: transparent;
        color: var(--md-sys-color-on-surface);
        font-family: inherit;
        font-size: var(--ot-editor-font-size, 22px);
        line-height: 1.45;
        padding: 0;
      }

      .source-textarea::placeholder {
        color: var(--md-sys-color-on-surface-variant);
        opacity: 0.72;
      }

      .source-textarea:focus {
        outline: none;
      }

      .clear-btn {
        position: absolute;
        top: 8px;
        right: 8px;
      }

      .output-wrap {
        flex: 1;
        padding: 18px 20px 10px 20px;
        display: flex;
        flex-direction: column;
      }

      .output-placeholder {
        font-size: var(--ot-editor-font-size, 22px);
        line-height: 1.45;
        color: var(--md-sys-color-on-surface-variant);
        user-select: none;
      }

      .output-text {
        font-size: var(--ot-editor-font-size, 22px);
        line-height: 1.45;
        color: var(--md-sys-color-on-surface);
        white-space: pre-wrap;
        word-break: break-word;
      }

      .error-box {
        margin-top: 4px;
        padding: 14px 16px;
        border-radius: calc(var(--ot-card-radius, 12px) * 0.75);
        background: color-mix(in srgb, var(--md-sys-color-error-container) 55%, var(--md-sys-color-surface-container));
        color: var(--md-sys-color-on-surface);
        font-size: 0.875rem;
        line-height: 1.5;
      }

      .error-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
        color: var(--md-sys-color-error);
        margin-bottom: 6px;
      }

      .error-box code {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
        background: var(--md-sys-color-surface-container-highest);
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.8125rem;
      }

      .error-actions {
        margin-top: 10px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .card-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 48px;
        padding: 4px 12px 8px 16px;
        gap: 8px;
      }

      .char-count {
        font-size: 0.75rem;
        color: var(--md-sys-color-on-surface-variant);
      }

      .footer-actions {
        display: flex;
        align-items: center;
        gap: 2px;
        margin-left: auto;
      }

      @media (max-width: 820px) {
        .panes {
          grid-template-columns: 1fr;
        }

        .card {
          min-height: 175px;
        }
      }
    `,
  ];

  @property({ attribute: false }) settings!: AppSettings;

  @state() private sourceText = '';
  @state() private translatedText = '';
  @state() private isTranslating = false;
  @state() private errorMessage: string | null = null;
  @state() private copiedTarget = false;
  @state() private copiedSource = false;
  @state() private isCurrentSaved = false;

  private debounceTimer: number | null = null;
  private abortController: AbortController | null = null;
  private lastLangSignature = '';

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('settings') && this.settings) {
      const sig = `${this.settings.sourceLang}|${this.settings.targetLang}|${this.settings.modelName}|${this.settings.streaming}`;
      if (this.lastLangSignature && sig !== this.lastLangSignature && this.sourceText.trim()) {
        this.scheduleTranslation(80);
      }
      this.lastLangSignature = sig;
    }
  }

  override disconnectedCallback(): void {
    if (this.debounceTimer !== null) window.clearTimeout(this.debounceTimer);
    this.abortController?.abort();
    super.disconnectedCallback();
  }

  public loadPair(source: string, translated: string): void {
    this.abortController?.abort();
    this.sourceText = source;
    this.translatedText = translated;
    this.errorMessage = null;
    this.isCurrentSaved = false;
  }

  public swapContentIfAvailable(): void {
    if (!this.translatedText.trim()) return;
    const nextSource = this.translatedText;
    const prevSource = this.sourceText;
    this.sourceText = nextSource;
    this.translatedText = prevSource;
    this.isCurrentSaved = false;
    this.scheduleTranslation(120);
  }

  private handleInput(e: Event): void {
    const textarea = e.target as HTMLTextAreaElement;
    this.sourceText = textarea.value;
    this.isCurrentSaved = false;

    // Auto-grow height smoothly
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(146, textarea.scrollHeight)}px`;

    const hint = this.settings.sourceLang === 'auto' ? detectScriptLanguageHint(this.sourceText) : null;
    this.dispatchDetectedLanguage(hint);

    if (!this.sourceText.trim()) {
      this.abortController?.abort();
      this.isTranslating = false;
      this.translatedText = '';
      this.errorMessage = null;
      return;
    }

    this.scheduleTranslation(460);
  }

  private handleKeydown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      this.runTranslationNow();
    }
  }

  private scheduleTranslation(delayMs: number): void {
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = window.setTimeout(() => {
      void this.executeTranslation();
    }, delayMs);
  }

  public runTranslationNow(): void {
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    void this.executeTranslation();
  }

  private stopActiveTranslation(): void {
    this.abortController?.abort();
    this.abortController = null;
    this.isTranslating = false;
  }

  private dispatchDetectedLanguage(code: string | null): void {
    this.dispatchEvent(
      new CustomEvent<string | null>('detected-language', {
        detail: code,
        bubbles: true,
        composed: true,
      })
    );
  }

  private async executeTranslation(): Promise<void> {
    const input = this.sourceText;
    if (!input.trim()) {
      this.translatedText = '';
      this.errorMessage = null;
      return;
    }

    this.abortController?.abort();
    const controller = new AbortController();
    this.abortController = controller;

    this.isTranslating = true;
    this.errorMessage = null;

    try {
      const result = await translateWithOllama({
        text: input,
        settings: this.settings,
        signal: controller.signal,
        onStreamChunk: (partial) => {
          this.translatedText = partial;
        },
      });

      if (controller.signal.aborted) return;

      this.translatedText = result.translatedText;
      this.dispatchDetectedLanguage(result.detectedSourceLang);

      if (result.translatedText.trim()) {
        this.dispatchEvent(
          new CustomEvent('translation-complete', {
            detail: {
              mode: 'text',
              sourceLang: result.detectedSourceLang || this.settings.sourceLang,
              targetLang: this.settings.targetLang,
              sourceText: input,
              translatedText: result.translatedText,
            },
            bubbles: true,
            composed: true,
          })
        );
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      this.errorMessage = err instanceof Error ? err.message : 'Ollama request failed';
    } finally {
      if (this.abortController === controller) {
        this.isTranslating = false;
        this.abortController = null;
      }
    }
  }

  private clearAll(): void {
    this.stopActiveTranslation();
    this.sourceText = '';
    this.translatedText = '';
    this.errorMessage = null;
    this.isCurrentSaved = false;
    this.dispatchDetectedLanguage(null);
    const textarea = this.renderRoot.querySelector<HTMLTextAreaElement>('.source-textarea');
    if (textarea) {
      textarea.style.height = '146px';
      textarea.focus();
    }
  }

  private async copyText(value: string, kind: 'source' | 'target'): Promise<void> {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      if (kind === 'target') {
        this.copiedTarget = true;
        setTimeout(() => {
          this.copiedTarget = false;
        }, 1600);
      } else {
        this.copiedSource = true;
        setTimeout(() => {
          this.copiedSource = false;
        }, 1600);
      }
    } catch {
      // Clipboard API unavailable in insecure context
    }
  }

  private toggleSaveCurrent(): void {
    if (!this.sourceText.trim() || !this.translatedText.trim()) return;
    this.isCurrentSaved = !this.isCurrentSaved;
    this.dispatchEvent(
      new CustomEvent('toggle-save-pair', {
        detail: {
          mode: 'text',
          sourceLang: this.settings.sourceLang,
          targetLang: this.settings.targetLang,
          sourceText: this.sourceText,
          translatedText: this.translatedText,
          saved: this.isCurrentSaved,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  private downloadTxt(): void {
    if (!this.translatedText.trim()) return;
    const blob = new Blob([this.translatedText], { type: 'text/plain;charset=utf-8' });
    triggerBlobDownload(blob, `opentranslate.${this.settings.targetLang}.txt`);
  }

  override render() {
    const t = STRINGS[this.settings?.uiLanguage || 'ru'];

    return html`
      <div class="panes">
        <!-- Left: Source Input Card -->
        <section class="card source-card" aria-label=${t.sourcePlaceholder}>
          <div class="editor-wrap">
            <textarea
              class="source-textarea"
              .value=${this.sourceText}
              placeholder=${t.sourcePlaceholder}
              aria-label=${t.sourcePlaceholder}
              spellcheck="true"
              @input=${this.handleInput}
              @keydown=${this.handleKeydown}
            ></textarea>

            ${this.sourceText
              ? html`
                  <md-icon-button
                    class="clear-btn"
                    aria-label=${t.clearText}
                    title=${t.clearText}
                    @click=${this.clearAll}
                  >
                    <md-icon>close</md-icon>
                  </md-icon-button>
                `
              : nothing}
          </div>

          <div class="card-footer">
            <span class="char-count">${this.sourceText.length} симв.</span>
            <div class="footer-actions">
              ${this.sourceText
                ? html`
                    <md-icon-button
                      aria-label=${t.copySource}
                      title=${this.copiedSource ? t.copied : t.copySource}
                      @click=${() => this.copyText(this.sourceText, 'source')}
                    >
                      <md-icon>${this.copiedSource ? 'check' : 'content_copy'}</md-icon>
                    </md-icon-button>
                  `
                : nothing}
            </div>
          </div>
        </section>

        <!-- Right: Translation Output Card -->
        <section class="card target-card" aria-live="polite" aria-label=${t.translationPlaceholder}>
          ${this.isTranslating
            ? html`
                <div class="progress-slot">
                  <md-linear-progress indeterminate aria-label=${t.translating}></md-linear-progress>
                </div>
              `
            : nothing}

          <div class="output-wrap">
            ${this.errorMessage
              ? html`
                  <div class="error-box" role="alert">
                    <div class="error-title">
                      <md-icon>error</md-icon>
                      <span>${t.connectionFailed}: ${this.errorMessage}</span>
                    </div>
                    <div>
                      Убедитесь, что локальный сервер Ollama запущен (<code>ollama serve</code>) и модель
                      загружена: <code>ollama pull ${this.settings.modelName}</code>.
                    </div>
                    <div class="error-actions">
                      <md-filled-tonal-button @click=${() => this.runTranslationNow()}>
                        <md-icon slot="icon">refresh</md-icon>
                        ${t.translateNow}
                      </md-filled-tonal-button>
                    </div>
                  </div>
                `
              : this.translatedText
                ? html`<div class="output-text">${this.translatedText}</div>`
                : html`<div class="output-placeholder">
                    ${this.isTranslating ? t.translating : t.translationPlaceholder}
                  </div>`}
          </div>

          <div class="card-footer">
            <div class="footer-actions">
              ${this.isTranslating
                ? html`
                    <md-text-button @click=${this.stopActiveTranslation}>
                      <md-icon slot="icon">stop</md-icon>
                      ${t.stopTranslation}
                    </md-text-button>
                  `
                : nothing}

              ${this.translatedText
                ? html`
                    <md-icon-button
                      aria-label=${this.isCurrentSaved ? t.unsaveTranslation : t.saveTranslation}
                      title=${this.isCurrentSaved ? t.unsaveTranslation : t.saveTranslation}
                      @click=${this.toggleSaveCurrent}
                    >
                      <md-icon>${this.isCurrentSaved ? 'star' : 'star_outline'}</md-icon>
                    </md-icon-button>

                    <md-icon-button
                      aria-label=${t.copyTranslation}
                      title=${this.copiedTarget ? t.copied : t.copyTranslation}
                      @click=${() => this.copyText(this.translatedText, 'target')}
                    >
                      <md-icon>${this.copiedTarget ? 'check' : 'content_copy'}</md-icon>
                    </md-icon-button>

                    <md-icon-button
                      aria-label=${t.downloadTranslationTxt}
                      title=${t.downloadTranslationTxt}
                      @click=${this.downloadTxt}
                    >
                      <md-icon>download</md-icon>
                    </md-icon-button>
                  `
                : nothing}
            </div>
          </div>
        </section>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ot-text-translator': OtTextTranslator;
  }
}
