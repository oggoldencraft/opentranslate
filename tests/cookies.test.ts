import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PROMPT_TEMPLATE, DEFAULT_SETTINGS } from '../src/constants/defaults';
import {
  clearOpenTranslateCookies,
  formatCookieHeader,
  loadSettingsFromCookies,
  PROMPT_COOKIE_NAME,
  saveSettingsToCookies,
  SETTINGS_COOKIE_NAME,
} from '../src/utils/cookies';

describe('Cookie-only persistence & privacy constraints', () => {
  it('loads required defaults when no cookies are set', () => {
    const settings = loadSettingsFromCookies('');
    expect(settings.themeMode).toBe('dark');
    expect(settings.seedColor).toBe('#00A884');
    expect(settings.modelName).toBe('kaelri/qwen3.5-mt:2b');
    expect(settings.modelEndpoint).toBe('http://localhost:11434');
    expect(settings.promptTemplate).toBe(DEFAULT_PROMPT_TEMPLATE);
  });

  it('formats cookie headers with Path=/, SameSite=Lax, no HttpOnly, and conditional Secure', () => {
    const localhostHeader = formatCookieHeader(SETTINGS_COOKIE_NAME, 'abc', 3600, {
      protocol: 'http:',
      hostname: 'localhost',
    });
    expect(localhostHeader).toContain('Path=/');
    expect(localhostHeader).toContain('SameSite=Lax');
    expect(localhostHeader).toContain('Max-Age=3600');
    expect(localhostHeader).not.toContain('HttpOnly');
    expect(localhostHeader).not.toContain('Secure');

    const httpsLocalhost = formatCookieHeader(SETTINGS_COOKIE_NAME, 'abc', 3600, {
      protocol: 'https:',
      hostname: 'localhost',
    });
    expect(httpsLocalhost).not.toContain('Secure');

    const httpLan = formatCookieHeader(SETTINGS_COOKIE_NAME, 'abc', 3600, {
      protocol: 'http:',
      hostname: '192.168.1.42',
    });
    expect(httpLan).not.toContain('Secure');
    expect(httpLan).toContain('SameSite=Lax');

    const httpsProd = formatCookieHeader(SETTINGS_COOKIE_NAME, 'abc', 3600, {
      protocol: 'https:',
      hostname: 'translate.example.org',
    });
    expect(httpsProd).toContain('Secure');
    expect(httpsProd).not.toContain('HttpOnly');
  });

  it('persists customized preferences to document.cookie and restores them accurately', () => {
    clearOpenTranslateCookies();
    const customPrompt = 'Translate from {{sourceLang}} to {{targetLang}}:\n{{text}}';
    saveSettingsToCookies({
      ...DEFAULT_SETTINGS,
      themeMode: 'light',
      seedColor: '#1a73e8',
      fontSize: 18,
      density: 'compact',
      layoutDensity: 'wide',
      cornerRadius: 20,
      sourceLang: 'de',
      autoDetect: false,
      targetLang: 'en',
      temperature: 0.35,
      topP: 0.85,
      maxTokens: 4096,
      streaming: false,
      promptTemplate: customPrompt,
    });

    expect(document.cookie).toContain(SETTINGS_COOKIE_NAME);
    expect(document.cookie).toContain(PROMPT_COOKIE_NAME);

    const reloaded = loadSettingsFromCookies();
    expect(reloaded.themeMode).toBe('light');
    expect(reloaded.seedColor).toBe('#1A73E8');
    expect(reloaded.fontSize).toBe(18);
    expect(reloaded.density).toBe('compact');
    expect(reloaded.layoutDensity).toBe('wide');
    expect(reloaded.cornerRadius).toBe(20);
    expect(reloaded.sourceLang).toBe('de');
    expect(reloaded.autoDetect).toBe(false);
    expect(reloaded.targetLang).toBe('en');
    expect(reloaded.temperature).toBe(0.35);
    expect(reloaded.topP).toBe(0.85);
    expect(reloaded.maxTokens).toBe(4096);
    expect(reloaded.streaming).toBe(false);
    expect(reloaded.promptTemplate).toBe(customPrompt);

    const reset = clearOpenTranslateCookies();
    expect(reset.themeMode).toBe('dark');
    expect(reset.seedColor).toBe('#00A884');
    expect(loadSettingsFromCookies().seedColor).toBe('#00A884');
  });

  it('never uses localStorage, sessionStorage, or indexedDB anywhere in src/', () => {
    const srcRoot = path.resolve(process.cwd(), 'src');
    const collectTsFiles = (dir: string): string[] => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const files: string[] = [];
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) files.push(...collectTsFiles(full));
        else if (e.isFile() && e.name.endsWith('.ts')) files.push(full);
      }
      return files;
    };

    for (const file of collectTsFiles(srcRoot)) {
      const raw = fs.readFileSync(file, 'utf8');
      // Strip comments before checking API usage
      const code = raw.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
      expect(code, `Forbidden localStorage in ${file}`).not.toMatch(/\blocalStorage\b/);
      expect(code, `Forbidden sessionStorage in ${file}`).not.toMatch(/\bsessionStorage\b/);
      expect(code, `Forbidden indexedDB in ${file}`).not.toMatch(/\bindexedDB\b/);
    }
  });
});
