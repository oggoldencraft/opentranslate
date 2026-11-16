import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../src/constants/defaults';
import { applyThemeToDocument, generateMaterialTokens } from '../src/utils/theme';

describe('Material 3 / Material You Dynamic Color Engine', () => {
  it('generates full Material 3 color tokens from cool green seed #00A884 for dark and light modes', () => {
    const darkTokens = generateMaterialTokens(DEFAULT_SETTINGS, true);
    const lightTokens = generateMaterialTokens(DEFAULT_SETTINGS, false);

    expect(darkTokens['--md-sys-color-primary']).toMatch(/^#[0-9a-f]{6}$/i);
    expect(darkTokens['--md-sys-color-secondary-container']).toMatch(/^#[0-9a-f]{6}$/i);
    expect(darkTokens['--md-sys-color-surface']).toMatch(/^#[0-9a-f]{6}$/i);
    expect(darkTokens['--md-sys-color-surface-container']).toMatch(/^#[0-9a-f]{6}$/i);

    // Dark surface must differ from light surface
    expect(darkTokens['--md-sys-color-surface']).not.toBe(lightTokens['--md-sys-color-surface']);
  });

  it('responds dynamically to seed color, variant, corner radius, and font size', () => {
    const customTokens = generateMaterialTokens(
      {
        ...DEFAULT_SETTINGS,
        seedColor: '#1A73E8',
        colorVariant: 'vibrant',
        contrastLevel: 0.5,
        cornerRadius: 24,
        fontSize: 19,
        density: 'spacious',
        layoutDensity: 'wide',
      },
      true
    );

    const defaultTokens = generateMaterialTokens(DEFAULT_SETTINGS, true);
    expect(customTokens['--md-sys-color-primary']).not.toBe(defaultTokens['--md-sys-color-primary']);
    expect(customTokens['--ot-card-radius']).toBe('24px');
    expect(customTokens['--ot-base-font-size']).toBe('19px');
    expect(customTokens['--ot-workspace-max-width']).toBe('1520px');
  });

  it('applies dark theme by default onto document.documentElement', () => {
    const isDark = applyThemeToDocument(DEFAULT_SETTINGS);
    expect(isDark).toBe(true);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('--md-sys-color-primary')).toBeTruthy();
  });
});
