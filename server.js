// Production server for Komik Lab (self-hosting option).
//
//   npx expo export --platform web
//   ANTHROPIC_API_KEY=... node server.js
//
// Serves the API routes used by the mobile app (/api/*) plus the web build.
// For EAS Hosting use `npx eas-cli@latest deploy` instead (see README).

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { createRequestHandler } = require('expo-server/adapter/http');

const DIST = path.join(__dirname, 'dist');
const CLIENT_DIR = path.join(DIST, 'client');
const SERVER_DIR = path.join(DIST, 'server');
const PORT = Number(process.env.PORT) || 3000;

if (!fs.existsSync(SERVER_DIR)) {
  console.error('dist/server tidak dijumpai. Jalankan dahulu: npx expo export --platform web');
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

const handleExpo = createRequestHandler({ build: SERVER_DIR });

/** Serves a file from dist/client if the URL maps to one; returns true when handled. */
function serveStatic(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const filePath = path.normalize(path.join(CLIENT_DIR, pathname));
  if (!filePath.startsWith(CLIENT_DIR + path.sep)) return false;
  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch {
    return false;
  }
  if (!stat.isFile()) return false;
  const immutable = pathname.startsWith('/_expo/') || pathname.startsWith('/assets/');
  res.writeHead(200, {
    'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream',
    'Content-Length': stat.size,
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=300',
  });
  if (req.method === 'HEAD') return res.end(), true;
  fs.createReadStream(filePath).pipe(res);
  return true;
}

http
  .createServer((req, res) => {
    if (serveStatic(req, res)) return;
    handleExpo(req, res, (error) => {
      console.error(error);
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    });
  })
  .listen(PORT, () => {
    console.log(`Komik Lab server berjalan di http://localhost:${PORT}`);
  });
