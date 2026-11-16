import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@material/web/icon/icon.js';
import '@material/web/ripple/ripple.js';
import { STRINGS } from '../constants/i18n';
import { sharedStyles } from '../styles/shared-styles';
import type { TranslationMode, UiLanguage } from '../types/settings';

interface ModeItem {
  id: TranslationMode;
  icon: string;
  label: string;
}

@customElement('ot-mode-nav')
export class OtModeNav extends LitElement {
  static override styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }

      .mode-tablist {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }

      .mode-pill {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        height: var(--ot-control-height, 40px);
        padding: 0 18px 0 14px;
        border-radius: var(--ot-pill-radius, 999px);
        border: 1px solid var(--md-sys-color-outline-variant);
        background: transparent;
        color: var(--md-sys-color-primary);
        font-family: inherit;
        font-size: 0.875rem;
        font-weight: 500;
        letter-spacing: 0.01em;
        cursor: pointer;
        overflow: hidden;
        transition:
          background-color 150ms ease,
          border-color 150ms ease,
          color 150ms ease;
        user-select: none;
      }

      .mode-pill:hover:not([aria-selected='true']) {
        background: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
      }

      .mode-pill[aria-selected='true'] {
        background: var(--md-sys-color-secondary-container);
        border-color: transparent;
        color: var(--md-sys-color-on-secondary-container);
      }

      .mode-pill md-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        font-variation-settings: 'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 20;
      }

      .mode-pill[aria-selected='true'] md-icon {
        color: var(--md-sys-color-primary);
        font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20;
      }

      @media (max-width: 520px) {
        .mode-pill {
          padding: 0 13px 0 11px;
          font-size: 0.8125rem;
        }
      }
    `,
  ];

  @property({ type: String }) mode: TranslationMode = 'text';
  @property({ type: String }) uiLanguage: UiLanguage = 'ru';

  private get modes(): ModeItem[] {
    const t = STRINGS[this.uiLanguage] || STRINGS.ru;
    return [
      { id: 'text', icon: 'translate', label: t.modeText },
      { id: 'image', icon: 'image', label: t.modeImages },
      { id: 'document', icon: 'description', label: t.modeDocuments },
    ];
  }

  private selectMode(mode: TranslationMode): void {
    if (mode === this.mode) return;
    this.dispatchEvent(
      new CustomEvent<TranslationMode>('mode-change', {
        detail: mode,
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleKeydown(e: KeyboardEvent, index: number): void {
    const items = this.modes;
    let nextIdx = -1;
    if (e.key === 'ArrowRight') nextIdx = (index + 1) % items.length;
    else if (e.key === 'ArrowLeft') nextIdx = (index - 1 + items.length) % items.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = items.length - 1;

    if (nextIdx !== -1) {
      e.preventDefault();
      const buttons = this.renderRoot.querySelectorAll<HTMLButtonElement>('.mode-pill');
      buttons[nextIdx]?.focus();
      this.selectMode(items[nextIdx].id);
    }
  }

  override render() {
    const items = this.modes;
    return html`
      <div class="mode-tablist" role="tablist" aria-label="Translation modes">
        ${items.map(
          (item, idx) => html`
            <button
              type="button"
              class="mode-pill"
              role="tab"
              id="tab-${item.id}"
              aria-selected=${this.mode === item.id ? 'true' : 'false'}
              tabindex=${this.mode === item.id ? '0' : '-1'}
              @click=${() => this.selectMode(item.id)}
              @keydown=${(e: KeyboardEvent) => this.handleKeydown(e, idx)}
            >
              <md-ripple></md-ripple>
              <md-icon aria-hidden="true">${item.icon}</md-icon>
              <span>${item.label}</span>
            </button>
          `
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ot-mode-nav': OtModeNav;
  }
}
