import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  const VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
  const VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY =
    process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  // ⚠️ RAW LOG (temporary only)
  console.log('Supabase Config:', {
    url: VITE_SUPABASE_URL,
    key: VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
  });

  if (!VITE_SUPABASE_URL || !VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY) {
    console.error('❌ Missing Supabase environment variables');
  }

  app.use(cors());
  app.use(bodyParser.json());

  // --- Supabase Proxy ---
  if (VITE_SUPABASE_URL) {
    app.use(
      '/api/supabase',
      createProxyMiddleware({
        target: VITE_SUPABASE_URL,
        changeOrigin: true,
        secure: false,
        pathRewrite: {
          '^/api/supabase': '',
        },
        on: {
          proxyReq: (proxyReq, req) => {
            if (!req.headers.apikey && VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY) {
              proxyReq.setHeader(
                'apikey',
                VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
              );
            }
            if (
              !req.headers.authorization &&
              VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
            ) {
              proxyReq.setHeader(
                'Authorization',
                `Bearer ${VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY}`
              );
            }
          },
          error: (err, req, res) => {
            console.error('❌ Proxy Error:', err.message);
            if ('writeHead' in res) {
              res.writeHead(500, {
                'Content-Type': 'application/json',
              });
              res.end(
                JSON.stringify({
                  error: 'Proxy Error',
                  details: err.message,
                })
              );
            }
          },
        },
        logger: console,
      })
    );
  }

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();