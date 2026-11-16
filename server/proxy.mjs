#!/usr/bin/env node
/**
 * OpenTranslate Minimal Stateless Local Proxy & Static Asset Server
 *
 * Privacy guarantees:
 * - Zero database, zero disk writes, zero session or translation history storage.
 * - Zero logging of request bodies, prompts, source text, or translated responses.
 * - Forwards `/api/ollama/*` directly to the local Ollama instance and streams chunks back.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || '0.0.0.0';
const DEFAULT_OLLAMA = process.env.OLLAMA_ENDPOINT || 'http://127.0.0.1:11434';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.wasm': 'application/wasm',
  '.gz': 'application/gzip',
};

function resolveOllamaOrigin(headerVal) {
  const raw = (Array.isArray(headerVal) ? headerVal[0] : headerVal)?.trim() || DEFAULT_OLLAMA;
  const parsed = new URL(raw);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Invalid protocol');
  }
  return parsed.origin;
}

async function handleOllamaProxy(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept, X-Ollama-Endpoint',
    });
    res.end();
    return;
  }

  let origin;
  try {
    origin = resolveOllamaOrigin(req.headers['x-ollama-endpoint']);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ error: 'Invalid X-Ollama-Endpoint' }));
    return;
  }

  const subPath = (req.url || '/').replace(/^\/api\/ollama/, '') || '/';
  const primaryUrl = `${origin}${subPath}`;
  const fallbackUrl = origin.includes('://localhost:')
    ? `${origin.replace('://localhost:', '://127.0.0.1:')}${subPath}`
    : null;

  const chunks = [];
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
  }
  const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

  const doFetch = async (url) => {
    const controller = new AbortController();
    req.on('close', () => {
      if (!res.writableEnded) controller.abort();
    });
    return fetch(url, {
      method: req.method || 'GET',
      headers: {
        ...(req.headers['content-type'] ? { 'Content-Type': String(req.headers['content-type']) } : {}),
        ...(req.headers['accept'] ? { Accept: String(req.headers['accept']) } : {}),
      },
      body,
      signal: controller.signal,
    });
  };

  try {
    let upstream;
    try {
      upstream = await doFetch(primaryUrl);
    } catch (err) {
      if (fallbackUrl) {
        upstream = await doFetch(fallbackUrl);
      } else {
        throw err;
      }
    }

    res.writeHead(upstream.status, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });

    if (!upstream.body) {
      res.end();
      return;
    }

    const stream = Readable.fromWeb(upstream.body);
    stream.on('error', () => {
      if (!res.writableEnded) res.end();
    });
    stream.pipe(res);
  } catch {
    if (!res.headersSent) {
      res.writeHead(502, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      });
    }
    if (!res.writableEnded) {
      res.end(JSON.stringify({ error: 'Local Ollama instance is unreachable.' }));
    }
  }
}

const server = http.createServer((req, res) => {
  const reqUrl = (req.url || '/').split('?')[0];

  if (reqUrl.startsWith('/api/ollama')) {
    void handleOllamaProxy(req, res);
    return;
  }

  if (!fs.existsSync(DIST_DIR)) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(
      JSON.stringify({
        service: 'OpenTranslate Stateless CORS Proxy',
        proxyPath: '/api/ollama/*',
        note: 'Run `npm run build` first to also serve static UI assets from this server, or use `npm run dev`.',
      })
    );
    return;
  }

  const safeRel = path.normalize(decodeURIComponent(reqUrl)).replace(/^(\.\.(\/|\\|$))+/, '');
  let targetFile = path.join(DIST_DIR, safeRel === '/' ? 'index.html' : safeRel);

  if (!fs.existsSync(targetFile) || fs.statSync(targetFile).isDirectory()) {
    targetFile = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(targetFile).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(targetFile).pipe(res);
});

server.listen(PORT, HOST, () => {
  process.stdout.write(`OpenTranslate stateless server listening on http://${HOST}:${PORT}\n`);
});
