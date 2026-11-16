import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const LOCAL_TESS_LANGS = ['eng', 'rus', 'deu', 'ukr'];

function resolveSafeOllamaBase(rawHeader: string | string[] | undefined): string {
  const candidate =
    (Array.isArray(rawHeader) ? rawHeader[0] : rawHeader)?.trim() ||
    process.env.OLLAMA_ENDPOINT ||
    'http://127.0.0.1:11434';
  const parsed = new URL(candidate);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Unsupported protocol');
  }
  return parsed.origin;
}

async function forwardStatelessOllama(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept, X-Ollama-Endpoint',
    });
    res.end();
    return;
  }

  let baseOrigin: string;
  try {
    baseOrigin = resolveSafeOllamaBase(req.headers['x-ollama-endpoint']);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid X-Ollama-Endpoint header' }));
    return;
  }

  const subPath = (req.url || '/').replace(/^\/api\/ollama/, '') || '/';
  const primaryUrl = `${baseOrigin}${subPath}`;
  const fallbackUrl = baseOrigin.includes('://localhost:')
    ? `${baseOrigin.replace('://localhost:', '://127.0.0.1:')}${subPath}`
    : null;

  // Read chunks strictly in memory only if retry to 127.0.0.1 may be needed; never log or persist.
  const bodyChunks: Buffer[] = [];
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    for await (const chunk of req) {
      bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
  }
  const bodyBuffer = bodyChunks.length > 0 ? Buffer.concat(bodyChunks) : undefined;

  const attemptFetch = async (targetUrl: string) => {
    const controller = new AbortController();
    req.on('close', () => {
      if (!res.writableEnded) controller.abort();
    });
    return fetch(targetUrl, {
      method: req.method || 'GET',
      headers: {
        ...(req.headers['content-type'] ? { 'Content-Type': String(req.headers['content-type']) } : {}),
        ...(req.headers['accept'] ? { Accept: String(req.headers['accept']) } : {}),
      },
      body: bodyBuffer,
      signal: controller.signal,
    });
  };

  try {
    let upstream: Response;
    try {
      upstream = await attemptFetch(primaryUrl);
    } catch (err) {
      if (fallbackUrl) {
        upstream = await attemptFetch(fallbackUrl);
      } else {
        throw err;
      }
    }

    res.writeHead(upstream.status, {
      'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });

    if (!upstream.body) {
      res.end();
      return;
    }

    const nodeStream = Readable.fromWeb(upstream.body as unknown as import('node:stream/web').ReadableStream);
    nodeStream.on('error', () => {
      if (!res.writableEnded) res.end();
    });
    nodeStream.pipe(res);
  } catch {
    if (!res.headersSent) {
      res.writeHead(502, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      });
    }
    if (!res.writableEnded) {
      res.end(
        JSON.stringify({
          error: 'Local Ollama instance is unreachable. Ensure Ollama is running (`ollama serve`).',
        })
      );
    }
  }
}

function resolveLocalOcrAsset(rootDir: string, reqPath: string): { filePath: string; contentType: string } | null {
  const clean = reqPath.split('?')[0];
  if (clean === '/ocr-assets/worker.min.js') {
    const p = path.join(rootDir, 'node_modules/tesseract.js/dist/worker.min.js');
    return fs.existsSync(p) ? { filePath: p, contentType: 'application/javascript; charset=utf-8' } : null;
  }
  if (clean.startsWith('/ocr-assets/core/')) {
    const fileName = path.basename(clean);
    const p = path.join(rootDir, 'node_modules/tesseract.js-core', fileName);
    if (!fs.existsSync(p)) return null;
    const contentType = fileName.endsWith('.wasm')
      ? 'application/wasm'
      : 'application/javascript; charset=utf-8';
    return { filePath: p, contentType };
  }
  if (clean.startsWith('/ocr-assets/tessdata/')) {
    const fileName = path.basename(clean);
    const langMatch = fileName.match(/^([a-z_]+)\.traineddata\.gz$/);
    if (!langMatch) return null;
    const lang = langMatch[1];
    const p = path.join(
      rootDir,
      'node_modules',
      `@tesseract.js-data/${lang}`,
      '4.0.0_best_int',
      `${lang}.traineddata.gz`
    );
    if (!fs.existsSync(p)) return null;
    return { filePath: p, contentType: 'application/gzip' };
  }
  return null;
}

function openTranslatePlugin(): Plugin {
  const rootDir = process.cwd();

  const attachMiddlewares = (middlewares: {
    use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void;
  }) => {
    middlewares.use((req, res, next) => {
      const url = req.url || '';
      if (url.startsWith('/api/ollama')) {
        void forwardStatelessOllama(req, res);
        return;
      }
      if (url.startsWith('/ocr-assets/')) {
        const asset = resolveLocalOcrAsset(rootDir, url);
        if (asset) {
          res.writeHead(200, {
            'Content-Type': asset.contentType,
            'Cache-Control': 'public, max-age=86400',
          });
          fs.createReadStream(asset.filePath).pipe(res);
          return;
        }
      }
      next();
    });
  };

  return {
    name: 'opentranslate-local-middleware',
    configureServer(server) {
      attachMiddlewares(server.middlewares);
    },
    configurePreviewServer(server) {
      attachMiddlewares(server.middlewares);
    },
    closeBundle() {
      const distOcr = path.join(rootDir, 'dist/ocr-assets');
      if (!fs.existsSync(path.join(rootDir, 'dist'))) return;
      fs.mkdirSync(path.join(distOcr, 'core'), { recursive: true });
      fs.mkdirSync(path.join(distOcr, 'tessdata'), { recursive: true });

      const workerSrc = path.join(rootDir, 'node_modules/tesseract.js/dist/worker.min.js');
      if (fs.existsSync(workerSrc)) {
        fs.copyFileSync(workerSrc, path.join(distOcr, 'worker.min.js'));
      }

      const coreDir = path.join(rootDir, 'node_modules/tesseract.js-core');
      if (fs.existsSync(coreDir)) {
        for (const file of fs.readdirSync(coreDir)) {
          if (file.startsWith('tesseract-core') && (file.endsWith('.js') || file.endsWith('.wasm'))) {
            fs.copyFileSync(path.join(coreDir, file), path.join(distOcr, 'core', file));
          }
        }
      }

      for (const lang of LOCAL_TESS_LANGS) {
        const trainedSrc = path.join(
          rootDir,
          'node_modules',
          `@tesseract.js-data/${lang}`,
          '4.0.0_best_int',
          `${lang}.traineddata.gz`
        );
        if (fs.existsSync(trainedSrc)) {
          fs.copyFileSync(trainedSrc, path.join(distOcr, 'tessdata', `${lang}.traineddata.gz`));
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [openTranslatePlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts'],
    server: {
      deps: {
        inline: ['@material/material-color-utilities'],
      },
    },
  },
});
