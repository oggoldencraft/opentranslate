import { LitElement, css, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/ripple/ripple.js';
import { STRINGS } from '../constants/i18n';
import { sharedStyles } from '../styles/shared-styles';
import type {
  AppSettings,
  InMemoryTranslationRecord,
  ThemeMode,
  TranslationMode,
} from '../types/settings';
import {
  clearOpenTranslateCookies,
  loadSettingsFromCookies,
  saveSettingsToCookies,
} from '../utils/cookies';
import { applyThemeToDocument } from '../utils/theme';

import './mode-nav';
import './language-bar';
import type { PickerSide } from './language-bar';
import './language-picker';
import './text-translator';
import type { OtTextTranslator } from './text-translator';
import './image-translator';
import './document-translator';
import './memory-drawer';
import './settings-dialog';

@customElement('open-translate-app')
export class OpenTranslateApp extends LitElement {
  static override styles = [
    sharedStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background: var(--md-sys-color-surface);
        color: var(--md-sys-color-on-surface);
      }

      /* Material 3 Top App Bar matching layouts/thepage.png */
      .top-app-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 64px;
        padding: 0 16px 0 20px;
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface);
        position: sticky;
        top: 0;
        z-index: 20;
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        user-select: none;
      }

      .brand-mark {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: var(--md-sys-color-primary-container);
        color: var(--md-sys-color-on-primary-container);
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .brand-mark md-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: var(--md-sys-color-primary);
      }

      .brand-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 500;
        letter-spacing: -0.01em;
        color: var(--md-sys-color-on-surface);
      }

      .app-bar-actions {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      /* Main Workspace Container */
      .main-container {
        width: 100%;
        max-width: var(--ot-workspace-max-width, 1280px);
        margin: 0 auto;
        padding: 20px var(--ot-page-padding, 24px) 56px;
        flex: 1;
      }

      .mode-row {
        margin-bottom: 14px;
      }

      .lang-bar-wrap {
        position: relative;
        margin-bottom: 6px;
      }

      .picker-overlay {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        z-index: 15;
      }

      /* Bottom circular quick buttons matching layouts/thepage.png */
      .bottom-shortcuts {
        margin-top: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 44px;
      }

      .shortcut-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
      }

      .circle-btn {
        position: relative;
        width: 68px;
        height: 68px;
        border-radius: 50%;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: transparent;
        color: var(--md-sys-color-on-surface-variant);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        overflow: hidden;
        transition:
          background-color 150ms ease,
          border-color 150ms ease,
          color 150ms ease;
      }

      .circle-btn:hover {
        background: var(--md-sys-color-surface-container);
        color: var(--md-sys-color-on-surface);
        border-color: var(--md-sys-color-outline);
      }

      .circle-btn md-icon {
        font-size: 26px;
        width: 26px;
        height: 26px;
      }

      .shortcut-count {
        position: absolute;
        top: 10px;
        right: 10px;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        border-radius: 999px;
        background: var(--md-sys-color-primary);
        color: var(--md-sys-color-on-primary);
        font-size: 0.6875rem;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .shortcut-label {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--md-sys-color-on-surface-variant);
      }

      @media (max-width: 640px) {
        .top-app-bar {
          padding: 0 10px 0 14px;
          height: 58px;
        }

        .main-container {
          padding: 14px 12px 40px;
        }

        .bottom-shortcuts {
          margin-top: 36px;
          gap: 32px;
        }

        .circle-btn {
          width: 58px;
          height: 58px;
        }
      }
    `,
  ];

  @state() private settings: AppSettings = loadSettingsFromCookies();
  @state() private mode: TranslationMode = 'text';
  @state() private openPicker: PickerSide = null;
  @state() private detectedLang: string | null = null;
  @state() private settingsOpen = false;
  @state() private memoryDrawerView: 'history' | 'saved' | null = null;
  @state() private isEffectiveDark = true;

  /**
   * Strictly volatile in-memory session list — NEVER persisted to cookies,
   * localStorage, sessionStorage, IndexedDB, or server.
   */
  @state() private sessionRecords: InMemoryTranslationRecord[] = [];

  private mediaQueryList: MediaQueryList | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.isEffectiveDark = applyThemeToDocument(this.settings);

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQueryList.addEventListener('change', this.handleSystemThemeChange);
    }
  }

  override disconnectedCallback(): void {
    this.mediaQueryList?.removeEventListener('change', this.handleSystemThemeChange);
    super.disconnectedCallback();
  }

  private handleSystemThemeChange = (): void => {
    if (this.settings.themeMode === 'system') {
      this.isEffectiveDark = applyThemeToDocument(this.settings);
    }
  };

  private updateSettings(patch: Partial<AppSettings>): void {
    const merged: AppSettings = {
      ...this.settings,
      ...patch,
    };
    const saved = saveSettingsToCookies(merged);
    this.settings = saved;
    this.isEffectiveDark = applyThemeToDocument(saved);
  }

  private resetAllSettings(): void {
    const fresh = clearOpenTranslateCookies();
    this.settings = fresh;
    this.detectedLang = null;
    this.isEffectiveDark = applyThemeToDocument(fresh);
  }

  private cycleThemeQuick(): void {
    const nextMode: ThemeMode = this.isEffectiveDark ? 'light' : 'dark';
    this.updateSettings({ themeMode: nextMode });
  }

  private handleSourceChange(code: string): void {
    this.openPicker = null;
    if (code !== 'auto' && code === this.settings.targetLang) {
      // Avoid identical source & target: swap gracefully
      const fallbackTarget =
        this.settings.sourceLang !== 'auto'
          ? this.settings.sourceLang
          : this.settings.lastExplicitSourceLang !== code
            ? this.settings.lastExplicitSourceLang
            : code === 'ru'
              ? 'en'
              : 'ru';
      this.updateSettings({
        sourceLang: code,
        autoDetect: false,
        lastExplicitSourceLang: code,
        targetLang: fallbackTarget,
      });
      return;
    }

    this.updateSettings({
      sourceLang: code,
      autoDetect: code === 'auto',
      ...(code !== 'auto' ? { lastExplicitSourceLang: code } : {}),
    });
  }

  private handleTargetChange(code: string): void {
    this.openPicker = null;
    if (code === this.settings.sourceLang) {
      const nextSource = this.settings.targetLang;
      this.updateSettings({
        sourceLang: nextSource,
        autoDetect: false,
        lastExplicitSourceLang: nextSource,
        targetLang: code,
      });
      return;
    }
    this.updateSettings({ targetLang: code });
  }

  private handleSwapLanguages(): void {
    this.openPicker = null;
    const effectiveFrom =
      this.settings.sourceLang === 'auto'
        ? this.detectedLang || this.settings.lastExplicitSourceLang || 'en'
        : this.settings.sourceLang;

    const prevTarget = this.settings.targetLang;
    const nextTarget = effectiveFrom === prevTarget ? (prevTarget === 'ru' ? 'en' : 'ru') : effectiveFrom;

    this.detectedLang = null;
    this.updateSettings({
      sourceLang: prevTarget,
      autoDetect: false,
      lastExplicitSourceLang: prevTarget,
      targetLang: nextTarget,
    });

    if (this.mode === 'text') {
      const textComp = this.renderRoot.querySelector<OtTextTranslator>('ot-text-translator');
      textComp?.swapContentIfAvailable();
    }
  }

  private recordInMemoryTranslation(detail: {
    mode: TranslationMode;
    sourceLang: string;
    targetLang: string;
    sourceText: string;
    translatedText: string;
  }): void {
    const trimmedSrc = detail.sourceText.trim();
    const trimmedDst = detail.translatedText.trim();
    if (!trimmedSrc || !trimmedDst) return;

    const existingIdx = this.sessionRecords.findIndex(
      (r) =>
        r.sourceText === trimmedSrc &&
        r.targetLang === detail.targetLang &&
        r.mode === detail.mode
    );

    if (existingIdx !== -1) {
      const updated = [...this.sessionRecords];
      updated[existingIdx] = {
        ...updated[existingIdx],
        translatedText: trimmedDst,
        timestamp: Date.now(),
      };
      this.sessionRecords = updated;
      return;
    }

    const record: InMemoryTranslationRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      mode: detail.mode,
      sourceLang: detail.sourceLang,
      targetLang: detail.targetLang,
      sourceText: trimmedSrc,
      translatedText: trimmedDst,
      timestamp: Date.now(),
      saved: false,
    };

    this.sessionRecords = [record, ...this.sessionRecords].slice(0, 50);
  }

  private handleToggleSavePair(detail: {
    mode: TranslationMode;
    sourceLang: string;
    targetLang: string;
    sourceText: string;
    translatedText: string;
    saved: boolean;
  }): void {
    const idx = this.sessionRecords.findIndex(
      (r) => r.sourceText === detail.sourceText.trim() && r.targetLang === detail.targetLang
    );
    if (idx !== -1) {
      const next = [...this.sessionRecords];
      next[idx] = { ...next[idx], saved: detail.saved };
      this.sessionRecords = next;
    } else if (detail.saved) {
      this.sessionRecords = [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          mode: detail.mode,
          sourceLang: detail.sourceLang,
          targetLang: detail.targetLang,
          sourceText: detail.sourceText.trim(),
          translatedText: detail.translatedText.trim(),
          timestamp: Date.now(),
          saved: true,
        },
        ...this.sessionRecords,
      ];
    }
  }

  override render() {
    const t = STRINGS[this.settings.uiLanguage] || STRINGS.ru;
    const savedCount = this.sessionRecords.filter((r) => r.saved).length;

    return html`
      <!-- Top App Bar -->
      <header class="top-app-bar">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true">
            <md-icon>translate</md-icon>
          </span>
          <h1 class="brand-title">OpenTranslate</h1>
        </div>

        <div class="app-bar-actions">
          <md-icon-button
            aria-label=${t.toggleTheme}
            title=${t.toggleTheme}
            @click=${this.cycleThemeQuick}
          >
            <md-icon>${this.isEffectiveDark ? 'light_mode' : 'dark_mode'}</md-icon>
          </md-icon-button>

          <md-icon-button
            aria-label=${t.openSettings}
            title=${t.openSettings}
            @click=${() => {
              this.settingsOpen = true;
            }}
          >
            <md-icon>settings</md-icon>
          </md-icon-button>
        </div>
      </header>

      <!-- Main Translation Workspace -->
      <main class="main-container">
        <div class="mode-row">
          <ot-mode-nav
            .mode=${this.mode}
            .uiLanguage=${this.settings.uiLanguage}
            @mode-change=${(e: CustomEvent<TranslationMode>) => {
              this.mode = e.detail;
              this.openPicker = null;
              this.detectedLang = null;
            }}
          ></ot-mode-nav>
        </div>

        <div class="lang-bar-wrap">
          <ot-language-bar
            .sourceLang=${this.settings.sourceLang}
            .targetLang=${this.settings.targetLang}
            .detectedLang=${this.detectedLang}
            .openPicker=${this.openPicker}
            .uiLanguage=${this.settings.uiLanguage}
            @source-change=${(e: CustomEvent<string>) => this.handleSourceChange(e.detail)}
            @target-change=${(e: CustomEvent<string>) => this.handleTargetChange(e.detail)}
            @toggle-picker=${(e: CustomEvent<PickerSide>) => {
              this.openPicker = e.detail;
            }}
            @swap-languages=${this.handleSwapLanguages}
          ></ot-language-bar>

          ${this.openPicker
            ? html`
                <div class="picker-overlay">
                  <ot-language-picker
                    .side=${this.openPicker}
                    .selectedCode=${this.openPicker === 'source'
                      ? this.settings.sourceLang
                      : this.settings.targetLang}
                    .uiLanguage=${this.settings.uiLanguage}
                    @close-picker=${() => {
                      this.openPicker = null;
                    }}
                    @pick-language=${(
                      e: CustomEvent<{ side: 'source' | 'target'; code: string }>
                    ) => {
                      if (e.detail.side === 'source') {
                        this.handleSourceChange(e.detail.code);
                      } else {
                        this.handleTargetChange(e.detail.code);
                      }
                    }}
                  ></ot-language-picker>
                </div>
              `
            : nothing}
        </div>

        <!-- Active Mode Panel -->
        <div
          role="tabpanel"
          aria-labelledby="tab-${this.mode}"
          @detected-language=${(e: CustomEvent<string | null>) => {
            this.detectedLang = e.detail;
          }}
          @translation-complete=${(
            e: CustomEvent<{
              mode: TranslationMode;
              sourceLang: string;
              targetLang: string;
              sourceText: string;
              translatedText: string;
            }>
          ) => this.recordInMemoryTranslation(e.detail)}
          @toggle-save-pair=${(
            e: CustomEvent<{
              mode: TranslationMode;
              sourceLang: string;
              targetLang: string;
              sourceText: string;
              translatedText: string;
              saved: boolean;
            }>
          ) => this.handleToggleSavePair(e.detail)}
        >
          ${this.mode === 'text'
            ? html`<ot-text-translator .settings=${this.settings}></ot-text-translator>`
            : this.mode === 'image'
              ? html`<ot-image-translator .settings=${this.settings}></ot-image-translator>`
              : html`<ot-document-translator .settings=${this.settings}></ot-document-translator>`}
        </div>

        <!-- Bottom In-Memory Shortcuts matching layouts/*.png -->
        <div class="bottom-shortcuts">
          <div class="shortcut-item">
            <button
              type="button"
              class="circle-btn"
              aria-label=${t.history}
              @click=${() => {
                this.memoryDrawerView = 'history';
              }}
            >
              <md-ripple></md-ripple>
              <md-icon aria-hidden="true">history</md-icon>
              ${this.sessionRecords.length > 0
                ? html`<span class="shortcut-count">${this.sessionRecords.length}</span>`
                : nothing}
            </button>
            <span class="shortcut-label">${t.history}</span>
          </div>

          <div class="shortcut-item">
            <button
              type="button"
              class="circle-btn"
              aria-label=${t.saved}
              @click=${() => {
                this.memoryDrawerView = 'saved';
              }}
            >
              <md-ripple></md-ripple>
              <md-icon aria-hidden="true">star_outline</md-icon>
              ${savedCount > 0 ? html`<span class="shortcut-count">${savedCount}</span>` : nothing}
            </button>
            <span class="shortcut-label">${t.saved}</span>
          </div>
        </div>
      </main>

      <!-- In-Memory Session History / Saved Dialog -->
      <ot-memory-drawer
        ?open=${this.memoryDrawerView !== null}
        .view=${this.memoryDrawerView || 'history'}
        .records=${this.sessionRecords}
        .uiLanguage=${this.settings.uiLanguage}
        @close-drawer=${() => {
          this.memoryDrawerView = null;
        }}
        @clear-memory=${() => {
          this.sessionRecords = [];
        }}
        @toggle-record-saved=${(e: CustomEvent<string>) => {
          this.sessionRecords = this.sessionRecords.map((r) =>
            r.id === e.detail ? { ...r, saved: !r.saved } : r
          );
        }}
        @select-record=${(e: CustomEvent<InMemoryTranslationRecord>) => {
          const rec = e.detail;
          this.memoryDrawerView = null;
          this.mode = 'text';
          this.updateSettings({
            sourceLang: rec.sourceLang,
            autoDetect: rec.sourceLang === 'auto',
            targetLang: rec.targetLang,
          });
          requestAnimationFrame(() => {
            const textComp = this.renderRoot.querySelector<OtTextTranslator>('ot-text-translator');
            textComp?.loadPair(rec.sourceText, rec.translatedText);
          });
        }}
      ></ot-memory-drawer>

      <!-- Settings & Material You Customization Dialog -->
      <ot-settings-dialog
        ?open=${this.settingsOpen}
        .settings=${this.settings}
        @close-settings=${() => {
          this.settingsOpen = false;
        }}
        @update-settings=${(e: CustomEvent<Partial<AppSettings>>) => {
          this.updateSettings(e.detail);
        }}
        @reset-settings=${this.resetAllSettings}
      ></ot-settings-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'open-translate-app': OpenTranslateApp;
  }
}
