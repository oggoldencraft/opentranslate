import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/ripple/ripple.js';
import { STRINGS } from '../constants/i18n';
import { LANGUAGES } from '../constants/languages';
import { sharedStyles } from '../styles/shared-styles';
import type { LanguageOption, UiLanguage } from '../types/settings';

@customElement('ot-language-picker')
export class OtLanguagePicker extends LitElement {
  static override styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }

      .picker-card {
        background: var(--md-sys-color-surface-container);
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: var(--ot-card-radius, 12px);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
        overflow: hidden;
        animation: slideDown 140ms cubic-bezier(0.2, 0, 0, 1);
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-6px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .search-bar {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface-container-low);
      }

      .search-input {
        flex: 1;
        height: 40px;
        border: none;
        background: transparent;
        color: var(--md-sys-color-on-surface);
        font-family: inherit;
        font-size: 0.9375rem;
        padding: 0 6px;
      }

      .search-input::placeholder {
        color: var(--md-sys-color-on-surface-variant);
      }

      .search-input:focus {
        outline: none;
      }

      .lang-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 2px 8px;
        padding: 12px 16px 18px;
        max-height: 62vh;
        overflow-y: auto;
      }

      .lang-item {
        position: relative;
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        min-height: 36px;
        padding: 6px 10px;
        border: none;
        border-radius: 6px;
        background: transparent;
        color: var(--md-sys-color-on-surface);
        font-family: inherit;
        font-size: 0.875rem;
        text-align: left;
        cursor: pointer;
        overflow: hidden;
      }

      .lang-item:hover {
        background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
      }

      .lang-item[data-selected='true'] {
        background: var(--md-sys-color-secondary-container);
        color: var(--md-sys-color-on-secondary-container);
        font-weight: 500;
      }

      .check-slot {
        width: 18px;
        height: 18px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .check-slot md-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--md-sys-color-primary);
      }

      .lang-label {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .auto-sparkle {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--md-sys-color-primary);
        flex-shrink: 0;
      }

      .empty-msg {
        grid-column: 1 / -1;
        padding: 28px 12px;
        text-align: center;
        color: var(--md-sys-color-on-surface-variant);
        font-size: 0.9375rem;
      }

      @media (max-width: 1100px) {
        .lang-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
      }

      @media (max-width: 820px) {
        .lang-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 480px) {
        .lang-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ];

  @property({ type: String }) side: 'source' | 'target' = 'source';
  @property({ type: String }) selectedCode = 'auto';
  @property({ type: String }) uiLanguage: UiLanguage = 'ru';

  @state() private query = '';

  override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('keydown', this.handleWindowKeydown);
    requestAnimationFrame(() => {
      const input = this.renderRoot.querySelector<HTMLInputElement>('.search-input');
      input?.focus();
    });
  }

  override disconnectedCallback(): void {
    window.removeEventListener('keydown', this.handleWindowKeydown);
    super.disconnectedCallback();
  }

  private handleWindowKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.closePicker();
    }
  };

  private closePicker(): void {
    this.dispatchEvent(
      new CustomEvent('close-picker', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private selectLanguage(code: string): void {
    this.dispatchEvent(
      new CustomEvent<{ side: 'source' | 'target'; code: string }>('pick-language', {
        detail: { side: this.side, code },
        bubbles: true,
        composed: true,
      })
    );
  }

  private getSortedFilteredLanguages(): LanguageOption[] {
    const q = this.query.trim().toLowerCase();
    const sorted = [...LANGUAGES].sort((a, b) => {
      const labelA = this.uiLanguage === 'ru' ? a.nameRu : a.nameEn;
      const labelB = this.uiLanguage === 'ru' ? b.nameRu : b.nameEn;
      return labelA.localeCompare(labelB, this.uiLanguage);
    });

    if (!q) return sorted;
    return sorted.filter(
      (l) =>
        l.nameRu.toLowerCase().includes(q) ||
        l.nameEn.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }

  override render() {
    const t = STRINGS[this.uiLanguage] || STRINGS.ru;
    const filtered = this.getSortedFilteredLanguages();
    const q = this.query.trim().toLowerCase();
    const showAutoOption =
      this.side === 'source' &&
      (!q || t.detectLanguage.toLowerCase().includes(q) || 'auto'.includes(q));

    return html`
      <div class="picker-card" role="dialog" aria-label=${t.searchLanguages}>
        <div class="search-bar">
          <md-icon-button aria-label="Back" @click=${this.closePicker}>
            <md-icon>arrow_back</md-icon>
          </md-icon-button>

          <input
            class="search-input"
            type="search"
            .value=${this.query}
            placeholder=${t.searchLanguages}
            aria-label=${t.searchLanguages}
            @input=${(e: Event) => {
              this.query = (e.target as HTMLInputElement).value;
            }}
          />

          ${this.query
            ? html`
                <md-icon-button
                  aria-label="Clear search"
                  @click=${() => {
                    this.query = '';
                  }}
                >
                  <md-icon>close</md-icon>
                </md-icon-button>
              `
            : nothing}
        </div>

        <div class="lang-grid" role="listbox">
          ${showAutoOption
            ? html`
                <button
                  type="button"
                  class="lang-item"
                  role="option"
                  aria-selected=${this.selectedCode === 'auto' ? 'true' : 'false'}
                  data-selected=${this.selectedCode === 'auto' ? 'true' : 'false'}
                  @click=${() => this.selectLanguage('auto')}
                >
                  <md-ripple></md-ripple>
                  <span class="check-slot">
                    ${this.selectedCode === 'auto' ? html`<md-icon>check</md-icon>` : nothing}
                  </span>
                  <span class="lang-label">${t.detectLanguage}</span>
                  <md-icon class="auto-sparkle" aria-hidden="true">auto_awesome</md-icon>
                </button>
              `
            : nothing}

          ${filtered.length === 0 && !showAutoOption
            ? html`<div class="empty-msg">${t.noLanguagesFound}</div>`
            : filtered.map((lang) => {
                const selected = this.selectedCode === lang.code;
                const label = this.uiLanguage === 'ru' ? lang.nameRu : lang.nameEn;
                return html`
                  <button
                    type="button"
                    class="lang-item"
                    role="option"
                    aria-selected=${selected ? 'true' : 'false'}
                    data-selected=${selected ? 'true' : 'false'}
                    @click=${() => this.selectLanguage(lang.code)}
                  >
                    <md-ripple></md-ripple>
                    <span class="check-slot">
                      ${selected ? html`<md-icon>check</md-icon>` : nothing}
                    </span>
                    <span class="lang-label">${label}</span>
                  </button>
                `;
              })}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ot-language-picker': OtLanguagePicker;
  }
}
