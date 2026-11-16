import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@material/web/button/text-button.js';
import '@material/web/dialog/dialog.js';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';
import { STRINGS } from '../constants/i18n';
import { getLanguageDisplayName } from '../constants/languages';
import { sharedStyles } from '../styles/shared-styles';
import type { InMemoryTranslationRecord, UiLanguage } from '../types/settings';

@customElement('ot-memory-drawer')
export class OtMemoryDrawer extends LitElement {
  static override styles = [
    sharedStyles,
    css`
      md-dialog {
        --md-dialog-container-color: var(--md-sys-color-surface-container-high);
        width: min(620px, 94vw);
      }

      .ram-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        margin-bottom: 14px;
        border-radius: 8px;
        background: var(--md-sys-color-secondary-container);
        color: var(--md-sys-color-on-secondary-container);
        font-size: 0.8125rem;
      }

      .ram-badge md-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--md-sys-color-primary);
        flex-shrink: 0;
      }

      .records {
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-height: 52vh;
        overflow-y: auto;
      }

      .record-item {
        padding: 12px 14px;
        border-radius: 10px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface);
        display: flex;
        flex-direction: column;
        gap: 6px;
        cursor: pointer;
        transition: border-color 140ms ease;
      }

      .record-item:hover {
        border-color: var(--md-sys-color-primary);
      }

      .record-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.75rem;
        color: var(--md-sys-color-on-surface-variant);
      }

      .record-src {
        font-size: 0.9rem;
        color: var(--md-sys-color-on-surface);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .record-dst {
        font-size: 0.9rem;
        color: var(--md-sys-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .empty {
        padding: 32px 12px;
        text-align: center;
        color: var(--md-sys-color-on-surface-variant);
        font-size: 0.9rem;
      }
    `,
  ];

  @property({ type: Boolean }) open = false;
  @property({ type: String }) view: 'history' | 'saved' = 'history';
  @property({ type: Array }) records: InMemoryTranslationRecord[] = [];
  @property({ type: String }) uiLanguage: UiLanguage = 'ru';

  private emitClose(): void {
    this.dispatchEvent(new CustomEvent('close-drawer', { bubbles: true, composed: true }));
  }

  private emitClear(): void {
    this.dispatchEvent(new CustomEvent('clear-memory', { bubbles: true, composed: true }));
  }

  private emitSelect(rec: InMemoryTranslationRecord): void {
    this.dispatchEvent(
      new CustomEvent<InMemoryTranslationRecord>('select-record', {
        detail: rec,
        bubbles: true,
        composed: true,
      })
    );
  }

  private emitToggleSave(e: Event, id: string): void {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent<string>('toggle-record-saved', {
        detail: id,
        bubbles: true,
        composed: true,
      })
    );
  }

  override render() {
    const t = STRINGS[this.uiLanguage] || STRINGS.ru;
    const filtered =
      this.view === 'saved' ? this.records.filter((r) => r.saved) : this.records;

    return html`
      <md-dialog ?open=${this.open} @closed=${this.emitClose}>
        <div slot="headline">${this.view === 'saved' ? t.saved : t.history}</div>
        <div slot="content">
          <div class="ram-badge">
            <md-icon aria-hidden="true">memory</md-icon>
            <span>${t.inMemorySessionNotice}</span>
          </div>

          ${filtered.length === 0
            ? html`<div class="empty">${this.view === 'saved' ? t.emptySaved : t.emptyHistory}</div>`
            : html`
                <div class="records">
                  ${filtered.map(
                    (rec) => html`
                      <div class="record-item" @click=${() => this.emitSelect(rec)}>
                        <div class="record-top">
                          <span>
                            ${getLanguageDisplayName(rec.sourceLang, this.uiLanguage)} →
                            ${getLanguageDisplayName(rec.targetLang, this.uiLanguage)}
                          </span>
                          <md-icon-button
                            aria-label=${t.saveTranslation}
                            @click=${(e: Event) => this.emitToggleSave(e, rec.id)}
                          >
                            <md-icon>${rec.saved ? 'star' : 'star_outline'}</md-icon>
                          </md-icon-button>
                        </div>
                        <div class="record-src">${rec.sourceText}</div>
                        <div class="record-dst">${rec.translatedText}</div>
                      </div>
                    `
                  )}
                </div>
              `}
        </div>
        <div slot="actions">
          ${this.records.length > 0
            ? html`
                <md-text-button @click=${this.emitClear}>
                  <md-icon slot="icon">delete_sweep</md-icon>
                  ${t.clearSessionHistory}
                </md-text-button>
              `
            : nothing}
          <md-text-button @click=${this.emitClose}>${t.closeDialog}</md-text-button>
        </div>
      </md-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ot-memory-drawer': OtMemoryDrawer;
  }
}
