import {
  argbFromHex,
  DynamicScheme,
  Hct,
  hexFromArgb,
  MaterialDynamicColors,
  SchemeExpressive,
  SchemeFidelity,
  SchemeMonochrome,
  SchemeNeutral,
  SchemeTonalSpot,
  SchemeVibrant,
} from '@material/material-color-utilities';
import type { AppSettings, M3SchemeVariant, ThemeMode } from '../types/settings';
import { DEFAULT_SETTINGS } from '../constants/defaults';

const mdc = new MaterialDynamicColors();

function buildDynamicScheme(
  seedHex: string,
  variant: M3SchemeVariant,
  isDark: boolean,
  contrastLevel: number
): DynamicScheme {
  let argb: number;
  try {
    argb = argbFromHex(seedHex);
  } catch {
    argb = argbFromHex(DEFAULT_SETTINGS.seedColor);
  }
  const sourceHct = Hct.fromInt(argb);
  const clampedContrast = Math.min(1, Math.max(-0.5, contrastLevel));

  switch (variant) {
    case 'vibrant':
      return new SchemeVibrant(sourceHct, isDark, clampedContrast);
    case 'expressive':
      return new SchemeExpressive(sourceHct, isDark, clampedContrast);
    case 'fidelity':
      return new SchemeFidelity(sourceHct, isDark, clampedContrast);
    case 'neutral':
      return new SchemeNeutral(sourceHct, isDark, clampedContrast);
    case 'monochrome':
      return new SchemeMonochrome(sourceHct, isDark, clampedContrast);
    case 'tonalSpot':
    default:
      return new SchemeTonalSpot(sourceHct, isDark, clampedContrast);
  }
}

export function resolveEffectiveDark(themeMode: ThemeMode): boolean {
  if (themeMode === 'dark') return true;
  if (themeMode === 'light') return false;
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return true;
}

/**
 * Generates authentic Material 3 Dynamic Color tokens (`--md-sys-color-*`)
 * plus Material 3 shape, typography, and density tokens from `AppSettings`.
 */
export function generateMaterialTokens(
  settings: Pick<
    AppSettings,
    | 'seedColor'
    | 'colorVariant'
    | 'contrastLevel'
    | 'fontSize'
    | 'density'
    | 'layoutDensity'
    | 'cornerRadius'
  >,
  isDark: boolean
): Record<string, string> {
  const scheme = buildDynamicScheme(
    settings.seedColor,
    settings.colorVariant,
    isDark,
    settings.contrastLevel
  );

  const hex = (dc: ReturnType<typeof mdc.primary>) => hexFromArgb(dc.getArgb(scheme));

  const densityMap = {
    compact: { scale: '-2', padY: '8px', padX: '12px', controlHeight: '36px' },
    comfortable: { scale: '0', padY: '12px', padX: '16px', controlHeight: '40px' },
    spacious: { scale: '1', padY: '16px', padX: '22px', controlHeight: '46px' },
  }[settings.density];

  const layoutMap = {
    compact: { maxWidth: '1060px', gap: '8px', pagePad: '16px' },
    standard: { maxWidth: '1280px', gap: '12px', pagePad: '24px' },
    wide: { maxWidth: '1520px', gap: '16px', pagePad: '32px' },
  }[settings.layoutDensity];

  const r = Math.max(0, Math.min(28, settings.cornerRadius));
  const pillRadius = r === 0 ? '0px' : `${Math.max(r * 2.5, 999)}px`;

  return {
    // Official Material 3 Dynamic Color Tokens consumed by @material/web & OpenTranslate surfaces
    '--md-sys-color-primary': hex(mdc.primary()),
    '--md-sys-color-on-primary': hex(mdc.onPrimary()),
    '--md-sys-color-primary-container': hex(mdc.primaryContainer()),
    '--md-sys-color-on-primary-container': hex(mdc.onPrimaryContainer()),
    '--md-sys-color-inverse-primary': hex(mdc.inversePrimary()),
    '--md-sys-color-secondary': hex(mdc.secondary()),
    '--md-sys-color-on-secondary': hex(mdc.onSecondary()),
    '--md-sys-color-secondary-container': hex(mdc.secondaryContainer()),
    '--md-sys-color-on-secondary-container': hex(mdc.onSecondaryContainer()),
    '--md-sys-color-tertiary': hex(mdc.tertiary()),
    '--md-sys-color-on-tertiary': hex(mdc.onTertiary()),
    '--md-sys-color-tertiary-container': hex(mdc.tertiaryContainer()),
    '--md-sys-color-on-tertiary-container': hex(mdc.onTertiaryContainer()),
    '--md-sys-color-error': hex(mdc.error()),
    '--md-sys-color-on-error': hex(mdc.onError()),
    '--md-sys-color-error-container': hex(mdc.errorContainer()),
    '--md-sys-color-on-error-container': hex(mdc.onErrorContainer()),
    '--md-sys-color-background': hex(mdc.background()),
    '--md-sys-color-on-background': hex(mdc.onBackground()),
    '--md-sys-color-surface': hex(mdc.surface()),
    '--md-sys-color-on-surface': hex(mdc.onSurface()),
    '--md-sys-color-surface-variant': hex(mdc.surfaceVariant()),
    '--md-sys-color-on-surface-variant': hex(mdc.onSurfaceVariant()),
    '--md-sys-color-surface-dim': hex(mdc.surfaceDim()),
    '--md-sys-color-surface-bright': hex(mdc.surfaceBright()),
    '--md-sys-color-surface-container-lowest': hex(mdc.surfaceContainerLowest()),
    '--md-sys-color-surface-container-low': hex(mdc.surfaceContainerLow()),
    '--md-sys-color-surface-container': hex(mdc.surfaceContainer()),
    '--md-sys-color-surface-container-high': hex(mdc.surfaceContainerHigh()),
    '--md-sys-color-surface-container-highest': hex(mdc.surfaceContainerHighest()),
    '--md-sys-color-outline': hex(mdc.outline()),
    '--md-sys-color-outline-variant': hex(mdc.outlineVariant()),
    '--md-sys-color-inverse-surface': hex(mdc.inverseSurface()),
    '--md-sys-color-inverse-on-surface': hex(mdc.inverseOnSurface()),
    '--md-sys-color-shadow': hex(mdc.shadow()),
    '--md-sys-color-scrim': hex(mdc.scrim()),
    '--md-sys-color-surface-tint': hex(mdc.surfaceTint()),

    // Shape tokens (driving @material/web & layout cards)
    '--md-sys-shape-corner-none': '0px',
    '--md-sys-shape-corner-extra-small': `${Math.round(r * 0.35)}px`,
    '--md-sys-shape-corner-small': `${Math.round(r * 0.65)}px`,
    '--md-sys-shape-corner-medium': `${r}px`,
    '--md-sys-shape-corner-large': `${Math.round(r * 1.35)}px`,
    '--md-sys-shape-corner-extra-large': `${Math.round(r * 1.8)}px`,
    '--md-sys-shape-corner-full': pillRadius,

    // Component shape bindings for @material/web
    '--md-filled-button-container-shape': `${Math.max(4, Math.round(r * 0.65))}px`,
    '--md-outlined-button-container-shape': `${Math.max(4, Math.round(r * 0.65))}px`,
    '--md-filled-tonal-button-container-shape': `${Math.max(4, Math.round(r * 0.65))}px`,
    '--md-dialog-container-shape': `${Math.round(r * 1.6)}px`,
    '--md-outlined-text-field-container-shape': `${Math.round(r * 0.75)}px`,
    '--md-outlined-select-text-field-container-shape': `${Math.round(r * 0.75)}px`,

    // Custom OpenTranslate layout & typography tokens
    '--ot-card-radius': `${r}px`,
    '--ot-pill-radius': pillRadius,
    '--ot-base-font-size': `${settings.fontSize}px`,
    '--ot-editor-font-size': `${Math.round(settings.fontSize * 1.35)}px`,
    '--ot-density-scale': densityMap.scale,
    '--ot-density-pad-y': densityMap.padY,
    '--ot-density-pad-x': densityMap.padX,
    '--ot-control-height': densityMap.controlHeight,
    '--ot-workspace-max-width': layoutMap.maxWidth,
    '--ot-workspace-gap': layoutMap.gap,
    '--ot-page-padding': layoutMap.pagePad,
  };
}

export function applyThemeToDocument(settings: AppSettings): boolean {
  const isDark = resolveEffectiveDark(settings.themeMode);
  if (typeof document === 'undefined') return isDark;

  const root = document.documentElement;
  const tokens = generateMaterialTokens(settings, isDark);

  for (const [prop, val] of Object.entries(tokens)) {
    root.style.setProperty(prop, val);
  }

  root.dataset.theme = isDark ? 'dark' : 'light';
  root.style.colorScheme = isDark ? 'dark' : 'light';
  root.style.fontSize = `${settings.fontSize}px`;

  return isDark;
}
