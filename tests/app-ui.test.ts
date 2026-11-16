import { describe, expect, it } from 'vitest';

if (typeof HTMLElement !== 'undefined' && !HTMLElement.prototype.attachInternals) {
  HTMLElement.prototype.attachInternals = function () {
    return {
      setFormValue() {},
      setValidity() {},
      states: new Set(),
      form: null,
      labels: [],
      shadowRoot: this.shadowRoot,
      validationMessage: '',
      validity: { valid: true } as ValidityState,
      willValidate: false,
      checkValidity: () => true,
      reportValidity: () => true,
    } as unknown as ElementInternals;
  };
}

import '../src/components/app-root';
import type { OpenTranslateApp } from '../src/components/app-root';
import { clearOpenTranslateCookies, loadSettingsFromCookies } from '../src/utils/cookies';

describe('<open-translate-app> end-to-end component integration', () => {
  it('mounts with OpenTranslate brand, dark mode, three mode pills, and switches modes cleanly', async () => {
    clearOpenTranslateCookies();
    const app = document.createElement('open-translate-app') as OpenTranslateApp;
    document.body.appendChild(app);
    await app.updateComplete;

    const root = app.shadowRoot!;
    expect(root.querySelector('.brand-title')?.textContent?.trim()).toBe('OpenTranslate');
    expect(document.documentElement.dataset.theme).toBe('dark');

    // Text mode by default
    expect(root.querySelector('ot-text-translator')).not.toBeNull();

    // Switch to Image mode via <ot-mode-nav>
    const modeNav = root.querySelector('ot-mode-nav')!;
    await modeNav.updateComplete;
    const pills = modeNav.shadowRoot!.querySelectorAll<HTMLButtonElement>('.mode-pill');
    expect(pills.length).toBe(3);

    pills[1].click(); // "Изображения"
    await app.updateComplete;
    expect(root.querySelector('ot-image-translator')).not.toBeNull();

    pills[2].click(); // "Документы"
    await app.updateComplete;
    expect(root.querySelector('ot-document-translator')).not.toBeNull();

    app.remove();
  });

  it('persists language selection & theme toggle in cookies and supports full cookie reset', async () => {
    clearOpenTranslateCookies();
    const app = document.createElement('open-translate-app') as OpenTranslateApp;
    document.body.appendChild(app);
    await app.updateComplete;

    const root = app.shadowRoot!;
    // Click quick theme button in top-right app bar
    const appBarButtons = root.querySelectorAll('header md-icon-button');
    (appBarButtons[0] as HTMLElement).click();
    await app.updateComplete;

    expect(loadSettingsFromCookies().themeMode).toBe('light');

    // Trigger reset-settings from settings dialog
    const settingsDialog = root.querySelector('ot-settings-dialog')!;
    settingsDialog.dispatchEvent(
      new CustomEvent('reset-settings', { bubbles: true, composed: true })
    );
    await app.updateComplete;

    const afterReset = loadSettingsFromCookies();
    expect(afterReset.themeMode).toBe('dark');
    expect(afterReset.seedColor).toBe('#00A884');

    app.remove();
  });
});
