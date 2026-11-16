import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/filled-tonal-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import '@material/web/dialog/dialog.js';
import '@material/web/divider/divider.js';
import '@material/web/icon/icon.js';
import '@material/web/select/outlined-select.js';
import '@material/web/select/select-option.js';
import '@material/web/slider/slider.js';
import '@material/web/switch/switch.js';
import '@material/web/tabs/primary-tab.js';
import '@material/web/tabs/tabs.js';
import '@material/web/textfield/outlined-text-field.js';
import { DEFAULT_PROMPT_TEMPLATE, SEED_COLOR_PRESETS } from '../constants/defaults';
import { STRINGS } from '../constants/i18n';
import { LANGUAGES } from '../constants/languages';
import { checkOllamaConnection, type OllamaConnectionStatus } from '../services/ollama';
import { sharedStyles } from '../styles/shared-styles';
import type {
  AppSettings,
  ComponentDensity,
  LayoutDensity,
  M3SchemeVariant,
  ThemeMode,
  UiLanguage,
} from '../types/settings';

@customElement('ot-settings-dialog')
export class OtSettingsDialog extends LitElement {
  static override styles = [
    sharedStyles,
    css`
      md-dialog {
        --md-dialog-container-color: var(--md-sys-color-surface-container-high);
        width: min(740px, 95vw);
        max-width: 740px;
      }

      .headline-col {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .subtitle {
        font-size: 0.8125rem;
        font-weight: 400;
        color: var(--md-sys-color-on-surface-variant);
      }

      md-tabs {
        margin-bottom: 18px;
        border-radius: 8px;
      }

      .tab-panel {
        display: flex;
        flex-direction: column;
        gap: 18px;
        padding: 4px 2px 10px;
      }

      .field-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .field-full {
        grid-column: 1 / -1;
      }

      md-outlined-text-field,
      md-outlined-select {
        width: 100%;
      }

      .control-card {
        padding: 14px 16px;
        border-radius: 10px;
        background: var(--md-sys-color-surface-container);
        border: 1px solid var(--md-sys-color-outline-variant);
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .control-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
      }

      .control-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--md-sys-color-on-surface);
      }

      .control-desc {
        font-size: 0.75rem;
        color: var(--md-sys-color-on-surface-variant);
        margin-top: 2px;
      }

      .value-pill {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--md-sys-color-primary);
        font-variant-numeric: tabular-nums;
      }

      .swatches {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
      }

      .swatch-btn {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: 2px solid var(--md-sys-color-outline-variant);
        cursor: pointer;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: transform 120ms ease, border-color 120ms ease;
      }

      .swatch-btn:hover {
        transform: scale(1.08);
      }

      .swatch-btn[data-active='true'] {
        border: 3px solid var(--md-sys-color-on-surface);
        box-shadow: 0 0 0 2px var(--md-sys-color-primary);
      }

      .custom-color-wrap {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-left: 6px;
      }

      .native-color {
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 8px;
        background: transparent;
        cursor: pointer;
        padding: 0;
      }

      .prompt-editor {
        width: 100%;
        min-height: 150px;
        resize: vertical;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface);
        color: var(--md-sys-color-on-surface);
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.825rem;
        line-height: 1.5;
      }

      .conn-status {
        padding: 10px 12px;
        border-radius: 8px;
        font-size: 0.8125rem;
        background: var(--md-sys-color-surface);
        border: 1px solid var(--md-sys-color-outline-variant);
      }

      .conn-ok {
        color: var(--md-sys-color-primary);
        font-weight: 500;
      }

      .conn-err {
        color: var(--md-sys-color-error);
        font-weight: 500;
      }

      .privacy-footer {
        margin-top: 4px;
        padding: 10px 12px;
        border-radius: 8px;
        background: var(--md-sys-color-secondary-container);
        color: var(--md-sys-color-on-secondary-container);
        font-size: 0.78rem;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .actions-bar {
        display: flex;
        width: 100%;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
      }

      @media (max-width: 640px) {
        .field-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ];

  @property({ type: Boolean }) open = false;
  @property({ attribute: false }) settings!: AppSettings;

  @state() private activeTab = 0;
  @state() private testingConn = false;
  @state() private connStatus: OllamaConnectionStatus | null = null;
  @state() private resetBanner = false;

  private patchSettings(patch: Partial<AppSettings>): void {
    this.resetBanner = false;
    this.dispatchEvent(
      new CustomEvent<Partial<AppSettings>>('update-settings', {
        detail: patch,
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleResetCookies(): void {
    this.connStatus = null;
    this.resetBanner = true;
    this.dispatchEvent(
      new CustomEvent('reset-settings', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private emitClose(): void {
    this.dispatchEvent(
      new CustomEvent('close-settings', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private async runConnectionTest(): Promise<void> {
    this.testingConn = true;
    this.connStatus = null;
    try {
      this.connStatus = await checkOllamaConnection(this.settings);
    } finally {
      this.testingConn = false;
    }
  }

  private renderAppearanceTab() {
    const t = STRINGS[this.settings.uiLanguage];

    return html`
      <div class="tab-panel">
        <div class="field-grid">
          <md-outlined-select
            label=${t.themeLabel}
            .value=${this.settings.themeMode}
            @change=${(e: Event) => {
              const val = (e.target as HTMLSelectElement).value as ThemeMode;
              this.patchSettings({ themeMode: val });
            }}
          >
            <md-select-option value="dark">${t.themeDark}</md-select-option>
            <md-select-option value="light">${t.themeLight}</md-select-option>
            <md-select-option value="system">${t.themeSystem}</md-select-option>
          </md-outlined-select>

          <md-outlined-select
            label=${t.schemeVariantLabel}
            .value=${this.settings.colorVariant}
            @change=${(e: Event) => {
              const val = (e.target as HTMLSelectElement).value as M3SchemeVariant;
              this.patchSettings({ colorVariant: val });
            }}
          >
            <md-select-option value="tonalSpot">Tonal Spot (Material You)</md-select-option>
            <md-select-option value="vibrant">Vibrant</md-select-option>
            <md-select-option value="expressive">Expressive</md-select-option>
            <md-select-option value="fidelity">Fidelity</md-select-option>
            <md-select-option value="neutral">Neutral</md-select-option>
            <md-select-option value="monochrome">Monochrome</md-select-option>
          </md-outlined-select>
        </div>

        <!-- Seed Accent Color Picker -->
        <div class="control-card">
          <div class="control-row">
            <span class="control-label">${t.accentColorLabel}</span>
            <span class="value-pill">${this.settings.seedColor}</span>
          </div>
          <div class="swatches">
            ${SEED_COLOR_PRESETS.map(
              (preset) => html`
                <button
                  type="button"
                  class="swatch-btn"
                  style="background:${preset.hex}"
                  title="${preset.label} (${preset.hex})"
                  aria-label="${preset.label}"
                  data-active=${this.settings.seedColor.toUpperCase() === preset.hex.toUpperCase()
                    ? 'true'
                    : 'false'}
                  @click=${() => this.patchSettings({ seedColor: preset.hex })}
                ></button>
              `
            )}

            <label class="custom-color-wrap">
              <input
                class="native-color"
                type="color"
                .value=${this.settings.seedColor}
                aria-label=${t.customHexLabel}
                @input=${(e: Event) => {
                  this.patchSettings({ seedColor: (e.target as HTMLInputElement).value });
                }}
              />
              <span class="control-desc">${t.customHexLabel}</span>
            </label>
          </div>
        </div>

        <!-- Sliders: Font Size, Corner Radius, Contrast Level -->
        <div class="field-grid">
          <div class="control-card">
            <div class="control-row">
              <span class="control-label">${t.fontSizeLabel}</span>
              <span class="value-pill">${this.settings.fontSize}px</span>
            </div>
            <md-slider
              min="13"
              max="22"
              step="1"
              labeled
              .value=${this.settings.fontSize}
              @input=${(e: Event) => {
                const v = Number((e.target as HTMLElement & { value: number }).value);
                this.patchSettings({ fontSize: v });
              }}
            ></md-slider>
          </div>

          <div class="control-card">
            <div class="control-row">
              <span class="control-label">${t.cornerRadiusLabel}</span>
              <span class="value-pill">${this.settings.cornerRadius}px</span>
            </div>
            <md-slider
              min="0"
              max="28"
              step="2"
              labeled
              .value=${this.settings.cornerRadius}
              @input=${(e: Event) => {
                const v = Number((e.target as HTMLElement & { value: number }).value);
                this.patchSettings({ cornerRadius: v });
              }}
            ></md-slider>
          </div>

          <div class="control-card field-full">
            <div class="control-row">
              <span class="control-label">${t.contrastLevelLabel}</span>
              <span class="value-pill">${this.settings.contrastLevel.toFixed(2)}</span>
            </div>
            <md-slider
              min="-0.5"
              max="1"
              step="0.25"
              labeled
              .value=${this.settings.contrastLevel}
              @input=${(e: Event) => {
                const v = Number((e.target as HTMLElement & { value: number }).value);
                this.patchSettings({ contrastLevel: v });
              }}
            ></md-slider>
          </div>
        </div>

        <div class="field-grid">
          <md-outlined-select
            label=${t.componentDensityLabel}
            .value=${this.settings.density}
            @change=${(e: Event) => {
              this.patchSettings({
                density: (e.target as HTMLSelectElement).value as ComponentDensity,
              });
            }}
          >
            <md-select-option value="compact">${t.densityCompact}</md-select-option>
            <md-select-option value="comfortable">${t.densityComfortable}</md-select-option>
            <md-select-option value="spacious">${t.densitySpacious}</md-select-option>
          </md-outlined-select>

          <md-outlined-select
            label=${t.layoutDensityLabel}
            .value=${this.settings.layoutDensity}
            @change=${(e: Event) => {
              this.patchSettings({
                layoutDensity: (e.target as HTMLSelectElement).value as LayoutDensity,
              });
            }}
          >
            <md-select-option value="compact">${t.layoutCompact}</md-select-option>
            <md-select-option value="standard">${t.layoutStandard}</md-select-option>
            <md-select-option value="wide">${t.layoutWide}</md-select-option>
          </md-outlined-select>

          <md-outlined-select
            class="field-full"
            label=${t.uiLanguageLabel}
            .value=${this.settings.uiLanguage}
            @change=${(e: Event) => {
              this.patchSettings({
                uiLanguage: (e.target as HTMLSelectElement).value as UiLanguage,
              });
            }}
          >
            <md-select-option value="ru">Русский (по умолчанию)</md-select-option>
            <md-select-option value="en">English</md-select-option>
          </md-outlined-select>
        </div>
      </div>
    `;
  }

  private renderModelTab() {
    const t = STRINGS[this.settings.uiLanguage];

    return html`
      <div class="tab-panel">
        <div class="field-grid">
          <md-outlined-text-field
            label=${t.endpointLabel}
            .value=${this.settings.modelEndpoint}
            placeholder="http://localhost:11434"
            @input=${(e: Event) => {
              this.patchSettings({ modelEndpoint: (e.target as HTMLInputElement).value });
            }}
          ></md-outlined-text-field>

          <md-outlined-text-field
            label=${t.modelNameLabel}
            .value=${this.settings.modelName}
            placeholder="kaelri/qwen3.5-mt:2b"
            @input=${(e: Event) => {
              this.patchSettings({ modelName: (e.target as HTMLInputElement).value });
            }}
          ></md-outlined-text-field>
        </div>

        <div class="control-card">
          <div class="control-row">
            <div>
              <div class="control-label">${t.streamingLabel}</div>
              <div class="control-desc">${t.streamingDescription}</div>
            </div>
            <md-switch
              ?selected=${this.settings.streaming}
              @change=${(e: Event) => {
                const sw = e.target as HTMLElement & { selected: boolean };
                this.patchSettings({ streaming: Boolean(sw.selected) });
              }}
            ></md-switch>
          </div>

          <md-divider></md-divider>

          <div class="control-row">
            <div>
              <div class="control-label">${t.useProxyLabel}</div>
              <div class="control-desc">${t.useProxyDescription}</div>
            </div>
            <md-switch
              ?selected=${this.settings.useLocalProxy}
              @change=${(e: Event) => {
                const sw = e.target as HTMLElement & { selected: boolean };
                this.patchSettings({ useLocalProxy: Boolean(sw.selected) });
              }}
            ></md-switch>
          </div>
        </div>

        <div class="field-grid">
          <div class="control-card">
            <div class="control-row">
              <span class="control-label">${t.temperatureLabel}</span>
              <span class="value-pill">${this.settings.temperature.toFixed(2)}</span>
            </div>
            <md-slider
              min="0"
              max="2"
              step="0.05"
              labeled
              .value=${this.settings.temperature}
              @input=${(e: Event) => {
                const v = Number((e.target as HTMLElement & { value: number }).value);
                this.patchSettings({ temperature: Number(v.toFixed(2)) });
              }}
            ></md-slider>
          </div>

          <div class="control-card">
            <div class="control-row">
              <span class="control-label">${t.topPLabel}</span>
              <span class="value-pill">${this.settings.topP.toFixed(2)}</span>
            </div>
            <md-slider
              min="0.05"
              max="1"
              step="0.05"
              labeled
              .value=${this.settings.topP}
              @input=${(e: Event) => {
                const v = Number((e.target as HTMLElement & { value: number }).value);
                this.patchSettings({ topP: Number(v.toFixed(2)) });
              }}
            ></md-slider>
          </div>

          <md-outlined-text-field
            class="field-full"
            type="number"
            min="64"
            max="16384"
            label=${t.maxTokensLabel}
            .value=${String(this.settings.maxTokens)}
            @input=${(e: Event) => {
              const v = Number((e.target as HTMLInputElement).value);
              if (Number.isFinite(v) && v >= 64) {
                this.patchSettings({ maxTokens: Math.round(v) });
              }
            }}
          ></md-outlined-text-field>
        </div>

        <div class="control-row">
          <md-filled-tonal-button
            ?disabled=${this.testingConn}
            @click=${this.runConnectionTest}
          >
            <md-icon slot="icon">lan</md-icon>
            ${this.testingConn ? t.testingConnection : t.testConnection}
          </md-filled-tonal-button>
        </div>

        ${this.connStatus
          ? html`
              <div class="conn-status">
                ${this.connStatus.ok
                  ? html`
                      <div class="conn-ok">
                        ✓ ${t.connectionOk}
                        (${this.connStatus.usedProxy ? 'via /api/ollama proxy' : 'direct'})
                      </div>
                      <div class="control-desc" style="margin-top:4px">
                        ${this.connStatus.hasConfiguredModel
                          ? `Модель «${this.settings.modelName}» найдена локально.`
                          : `Модель «${this.settings.modelName}» ещё не загружена. Выполните: ollama pull ${this.settings.modelName}`}
                      </div>
                    `
                  : html`
                      <div class="conn-err">✕ ${t.connectionFailed}: ${this.connStatus.error}</div>
                    `}
              </div>
            `
          : nothing}
      </div>
    `;
  }

  private renderLanguagesPromptTab() {
    const t = STRINGS[this.settings.uiLanguage];

    return html`
      <div class="tab-panel">
        <div class="control-card">
          <div class="control-row">
            <span class="control-label">${t.autoDetectToggleLabel}</span>
            <md-switch
              ?selected=${this.settings.sourceLang === 'auto'}
              @change=${(e: Event) => {
                const sw = e.target as HTMLElement & { selected: boolean };
                const enabled = Boolean(sw.selected);
                this.patchSettings({
                  autoDetect: enabled,
                  sourceLang: enabled ? 'auto' : this.settings.lastExplicitSourceLang || 'en',
                });
              }}
            ></md-switch>
          </div>
        </div>

        <div class="field-grid">
          <md-outlined-select
            label=${t.defaultSourceLabel}
            .value=${this.settings.sourceLang}
            @change=${(e: Event) => {
              const code = (e.target as HTMLSelectElement).value;
              this.patchSettings({
                sourceLang: code,
                autoDetect: code === 'auto',
                ...(code !== 'auto' ? { lastExplicitSourceLang: code } : {}),
              });
            }}
          >
            <md-select-option value="auto">${t.detectLanguage}</md-select-option>
            ${LANGUAGES.map(
              (l) => html`
                <md-select-option value=${l.code}>
                  ${this.settings.uiLanguage === 'ru' ? l.nameRu : l.nameEn}
                </md-select-option>
              `
            )}
          </md-outlined-select>

          <md-outlined-select
            label=${t.defaultTargetLabel}
            .value=${this.settings.targetLang}
            @change=${(e: Event) => {
              const code = (e.target as HTMLSelectElement).value;
              this.patchSettings({ targetLang: code });
            }}
          >
            ${LANGUAGES.map(
              (l) => html`
                <md-select-option value=${l.code}>
                  ${this.settings.uiLanguage === 'ru' ? l.nameRu : l.nameEn}
                </md-select-option>
              `
            )}
          </md-outlined-select>
        </div>

        <div class="control-card">
          <div class="control-row">
            <div>
              <div class="control-label">${t.promptTemplateLabel}</div>
              <div class="control-desc">${t.promptTemplateHint}</div>
            </div>
            <md-text-button
              @click=${() => this.patchSettings({ promptTemplate: DEFAULT_PROMPT_TEMPLATE })}
            >
              ${t.restoreDefaultPrompt}
            </md-text-button>
          </div>

          <textarea
            class="prompt-editor"
            .value=${this.settings.promptTemplate}
            aria-label=${t.promptTemplateLabel}
            @input=${(e: Event) => {
              this.patchSettings({
                promptTemplate: (e.target as HTMLTextAreaElement).value,
              });
            }}
          ></textarea>
        </div>
      </div>
    `;
  }

  override render() {
    if (!this.settings) return nothing;
    const t = STRINGS[this.settings.uiLanguage] || STRINGS.ru;

    return html`
      <md-dialog ?open=${this.open} @closed=${this.emitClose}>
        <div slot="headline" class="headline-col">
          <span>${t.settingsTitle}</span>
          <span class="subtitle">${t.settingsSubtitle}</span>
        </div>

        <div slot="content">
          <md-tabs
            .activeTabIndex=${this.activeTab}
            @change=${(e: Event) => {
              const tabs = e.target as HTMLElement & { activeTabIndex: number };
              this.activeTab = tabs.activeTabIndex;
            }}
          >
            <md-primary-tab>
              <md-icon slot="icon">palette</md-icon>
              ${t.tabAppearance}
            </md-primary-tab>
            <md-primary-tab>
              <md-icon slot="icon">smart_toy</md-icon>
              ${t.tabModel}
            </md-primary-tab>
            <md-primary-tab>
              <md-icon slot="icon">tune</md-icon>
              ${t.tabLanguagesPrompt}
            </md-primary-tab>
          </md-tabs>

          ${this.activeTab === 0
            ? this.renderAppearanceTab()
            : this.activeTab === 1
              ? this.renderModelTab()
              : this.renderLanguagesPromptTab()}

          ${this.resetBanner
            ? html`<div class="conn-status conn-ok" style="margin-bottom:8px">
                ✓ ${t.resetConfirmDone}
              </div>`
            : nothing}

          <div class="privacy-footer">
            <md-icon aria-hidden="true">cookie</md-icon>
            <span>${t.cookiePrivacyNote}</span>
          </div>
        </div>

        <div slot="actions" class="actions-bar">
          <md-outlined-button @click=${this.handleResetCookies}>
            <md-icon slot="icon">restart_alt</md-icon>
            ${t.resetAllSettings}
          </md-outlined-button>

          <md-filled-button @click=${this.emitClose}>
            ${t.closeDialog}
          </md-filled-button>
        </div>
      </md-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ot-settings-dialog': OtSettingsDialog;
  }
}
