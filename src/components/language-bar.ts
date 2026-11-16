import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/ripple/ripple.js';
import { STRINGS } from '../constants/i18n';
import {
  DEFAULT_SOURCE_QUICK_LANGS,
  DEFAULT_TARGET_QUICK_LANGS,
  getLanguageDisplayName,
} from '../constants/languages';
import { sharedStyles } from '../styles/shared-styles';
import type { UiLanguage } from '../types/settings';

export type PickerSide = 'source' | 'target' | null;

@customElement('ot-language-bar')
export class OtLanguageBar extends LitElement {
  static override styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }

      .bar-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        align-items: center;
        gap: 4px;
        min-height: 48px;
      }

      .lang-side {
        display: flex;
        align-items: center;
        min-width: 0;
        overflow-x: auto;
        scrollbar-width: none;
      }

      .lang-side::-webkit-scrollbar {
        display: none;
      }

      .lang-tab {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 46px;
        padding: 0 14px;
        border: none;
        background: transparent;
        color: var(--md-sys-color-on-surface-variant);
        font-family: inherit;
        font-size: 0.875rem;
        font-weight: 500;
        white-space: nowrap;
        cursor: pointer;
        border-radius: 8px 8px 0 0;
        overflow: hidden;
        transition: color 140ms ease;
      }

      .lang-tab:hover {
        color: var(--md-sys-color-on-surface);
        background: color-mix(in srgb, var(--md-sys-color-on-surface) 6%, transparent);
      }

      .lang-tab[data-active='true'] {
        color: var(--md-sys-color-primary);
      }

      .lang-tab[data-active='true']::after {
        content: '';
        position: absolute;
        left: 8px;
        right: 8px;
        bottom: 0;
        height: 3px;
        border-radius: 3px 3px 0 0;
        background: var(--md-sys-color-primary);
      }

      .expand-btn {
        flex-shrink: 0;
        margin-left: 2px;
      }

      .expand-btn md-icon {
        transition: transform 180ms ease;
      }

      .expand-btn[data-open='true'] md-icon {
        transform: rotate(180deg);
        color: var(--md-sys-color-primary);
      }

      .swap-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
      }

      @media (max-width: 820px) {
        .bar-grid {
          grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        }

        .lang-tab.hide-mobile {
          display: none;
        }

        .lang-tab {
          padding: 0 10px;
          font-size: 0.8125rem;
        }
      }
    `,
  ];

  @property({ type: String }) sourceLang = 'auto';
  @property({ type: String }) targetLang = 'ru';
  @property({ type: String }) detectedLang: string | null = null;
  @property({ type: String }) openPicker: PickerSide = null;
  @property({ type: String }) uiLanguage: UiLanguage = 'ru';

  private buildQuickList(defaults: string[], current: string): string[] {
    const base = [...defaults];
    if (current && current !== 'auto' && !base.includes(current)) {
      base[0] = current;
    }
    return base;
  }

  private emitSource(code: string): void {
    this.dispatchEvent(
      new CustomEvent<string>('source-change', {
        detail: code,
        bubbles: true,
        composed: true,
      })
    );
  }

  private emitTarget(code: string): void {
    this.dispatchEvent(
      new CustomEvent<string>('target-change', {
        detail: code,
        bubbles: true,
        composed: true,
      })
    );
  }

  private emitTogglePicker(side: 'source' | 'target'): void {
    const next: PickerSide = this.openPicker === side ? null : side;
    this.dispatchEvent(
      new CustomEvent<PickerSide>('toggle-picker', {
        detail: next,
        bubbles: true,
        composed: true,
      })
    );
  }

  private emitSwap(): void {
    this.dispatchEvent(
      new CustomEvent('swap-languages', {
        bubbles: true,
        composed: true,
      })
    );
  }

  override render() {
    const t = STRINGS[this.uiLanguage] || STRINGS.ru;
    const sourceQuick = this.buildQuickList(DEFAULT_SOURCE_QUICK_LANGS, this.sourceLang);
    const targetQuick = this.buildQuickList(DEFAULT_TARGET_QUICK_LANGS, this.targetLang);

    const autoLabel =
      this.sourceLang === 'auto' && this.detectedLang
        ? `${getLanguageDisplayName(this.detectedLang, this.uiLanguage)} ${t.detectedAutoSuffix}`
        : t.detectLanguage;

    return html`
      <div class="bar-grid">
        <!-- Source Languages -->
        <div class="lang-side" role="group" aria-label=${t.defaultSourceLabel}>
          <button
            type="button"
            class="lang-tab"
            data-active=${this.sourceLang === 'auto' ? 'true' : 'false'}
            @click=${() => this.emitSource('auto')}
          >
            <md-ripple></md-ripple>
            <span>${autoLabel}</span>
          </button>

          ${sourceQuick.map(
            (code, idx) => html`
              <button
                type="button"
                class="lang-tab ${idx > 0 && this.sourceLang !== code ? 'hide-mobile' : ''}"
                data-active=${this.sourceLang === code ? 'true' : 'false'}
                @click=${() => this.emitSource(code)}
              >
                <md-ripple></md-ripple>
                <span>${getLanguageDisplayName(code, this.uiLanguage)}</span>
              </button>
            `
          )}

          <md-icon-button
            class="expand-btn"
            data-open=${this.openPicker === 'source' ? 'true' : 'false'}
            aria-label=${t.moreSourceLanguages}
            aria-expanded=${this.openPicker === 'source' ? 'true' : 'false'}
            @click=${() => this.emitTogglePicker('source')}
          >
            <md-icon>expand_more</md-icon>
          </md-icon-button>
        </div>

        <!-- Swap Languages -->
        <div class="swap-wrap">
          <md-icon-button
            aria-label=${t.swapLanguages}
            title=${t.swapLanguages}
            @click=${this.emitSwap}
          >
            <md-icon>swap_horiz</md-icon>
          </md-icon-button>
        </div>

        <!-- Target Languages -->
        <div class="lang-side" role="group" aria-label=${t.defaultTargetLabel}>
          ${targetQuick.map(
            (code, idx) => html`
              <button
                type="button"
                class="lang-tab ${idx > 0 && this.targetLang !== code ? 'hide-mobile' : ''}"
                data-active=${this.targetLang === code ? 'true' : 'false'}
                @click=${() => this.emitTarget(code)}
              >
                <md-ripple></md-ripple>
                <span>${getLanguageDisplayName(code, this.uiLanguage)}</span>
              </button>
            `
          )}

          <md-icon-button
            class="expand-btn"
            data-open=${this.openPicker === 'target' ? 'true' : 'false'}
            aria-label=${t.moreTargetLanguages}
            aria-expanded=${this.openPicker === 'target' ? 'true' : 'false'}
            @click=${() => this.emitTogglePicker('target')}
          >
            <md-icon>expand_more</md-icon>
          </md-icon-button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ot-language-bar': OtLanguageBar;
  }
}
