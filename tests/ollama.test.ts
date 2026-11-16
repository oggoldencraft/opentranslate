import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_PROMPT_TEMPLATE, DEFAULT_SETTINGS } from '../src/constants/defaults';
import {
  buildTranslationPrompt,
  cleanModelTranslationOutput,
  shouldPreferRelativeProxy,
  translateWithOllama,
} from '../src/services/ollama';
import '../src/components/mode-nav';
import type { OtModeNav } from '../src/components/mode-nav';

describe('Ollama Qwen3.5-MT integration & UI navigation constraints', () => {
  it('injects explicit canonical source and target languages into the prompt', () => {
    const prompt = buildTranslationPrompt(
      DEFAULT_PROMPT_TEMPLATE,
      'de',
      'ru',
      'Guten Morgen!\nWie geht es dir?'
    );
    expect(prompt).toContain('German (de)');
    expect(prompt).toContain('Russian (ru)');
    expect(prompt).toContain('Guten Morgen!\nWie geht es dir?');
  });

  it('strips <think> blocks while preserving translation line breaks', () => {
    const raw = '<think>\nTranslating greeting...\n</think>\nДоброе утро!\nКак дела?';
    expect(cleanModelTranslationOutput(raw)).toBe('Доброе утро!\nКак дела?');

    const midStream = '<think>Still thinking about grammar';
    expect(cleanModelTranslationOutput(midStream)).toBe('');
  });

  it('streams NDJSON tokens from Ollama /api/chat and falls back to stateless proxy on CORS failure', async () => {
    const chunks = [
      JSON.stringify({ message: { content: 'Доверять ' }, done: false }) + '\n',
      JSON.stringify({ message: { content: 'ему?\nда' }, done: true }) + '\n',
    ];
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        for (const c of chunks) controller.enqueue(encoder.encode(c));
        controller.close();
      },
    });

    const fetchMock = vi
      .fn()
      // Simulate CORS TypeError on direct localhost fetch, then succeed via /api/ollama proxy
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(
        new Response(stream, {
          status: 200,
          headers: { 'Content-Type': 'application/x-ndjson' },
        })
      );

    vi.stubGlobal('fetch', fetchMock);

    const partials: string[] = [];
    const res = await translateWithOllama({
      text: 'Trust him?\nyes',
      settings: { ...DEFAULT_SETTINGS, useLocalProxy: false },
      onStreamChunk: (p) => partials.push(p),
    });

    expect(res.translatedText).toBe('Доверять ему?\nда');
    expect(partials).toContain('Доверять');
    expect(partials.at(-1)).toBe('Доверять ему?\nда');

    // Verify second call used stateless relative proxy `/api/ollama/api/chat`
    const lastCallUrl = fetchMock.mock.calls.at(-1)?.[0];
    expect(lastCallUrl).toBe('/api/ollama/api/chat');
    vi.unstubAllGlobals();
  });

  it('renders strictly the three mode pills ("Текст", "Изображения", "Документы") with icon left + text right and NO website button', async () => {
    const nav = document.createElement('ot-mode-nav') as OtModeNav;
    document.body.appendChild(nav);
    await nav.updateComplete;

    const pills = Array.from(nav.shadowRoot!.querySelectorAll<HTMLButtonElement>('.mode-pill'));
    expect(pills.length).toBe(3);

    const labels = pills.map((btn) => btn.querySelector('span')?.textContent?.trim());
    expect(labels).toEqual(['Текст', 'Изображения', 'Документы']);

    // Verify each pill has md-icon first (left) and span second (right)
    for (const pill of pills) {
      const elementTags = Array.from(pill.children)
        .map((el) => el.tagName.toLowerCase())
        .filter((t) => t !== 'md-ripple');
      expect(elementTags).toEqual(['md-icon', 'span']);
    }

    // Ensure no website translation button exists
    const allText = nav.shadowRoot!.textContent || '';
    expect(allText).not.toContain('Сайты');
    expect(allText.toLowerCase()).not.toContain('website');

    nav.remove();
  });

  it('routes LAN clients (e.g. 192.168.x.x) and 0.0.0.0 endpoints automatically through the stateless /api/ollama proxy', () => {
    expect(
      shouldPreferRelativeProxy(
        { useLocalProxy: false, modelEndpoint: 'http://localhost:11434' },
        { hostname: '192.168.1.42', protocol: 'http:' }
      )
    ).toBe(true);

    expect(
      shouldPreferRelativeProxy(
        { useLocalProxy: false, modelEndpoint: 'http://0.0.0.0:11434' },
        { hostname: 'localhost', protocol: 'http:' }
      )
    ).toBe(true);

    expect(
      shouldPreferRelativeProxy(
        { useLocalProxy: false, modelEndpoint: 'http://localhost:11434' },
        { hostname: 'localhost', protocol: 'http:' }
      )
    ).toBe(false);
  });
});
