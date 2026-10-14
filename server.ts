/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Express + Vite Full-Stack Server
 * Mounts backend REST API & Drizzle SQLite engine with Vite dev middlewares on port 3000.
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './src/server/db/index.ts';
import { seedDatabaseIfEmpty } from './src/server/db/seed.ts';
import { apiRouter } from './src/server/routes/apiRoutes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolvePort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(parsed) && parsed !== 8080 && parsed !== 8000) return parsed;
  }
  if (process.env.DEFAULT_APP_PORT) {
    const parsed = parseInt(process.env.DEFAULT_APP_PORT, 10);
    if (!isNaN(parsed) && parsed !== 8080 && parsed !== 8000) return parsed;
  }
  if (process.env.PORT) {
    const parsed = parseInt(process.env.PORT, 10);
    if (!isNaN(parsed) && parsed !== 8080 && parsed !== 8000) return parsed;
  }
  return 3000;
}

async function startServer() {
  const app = express();
  const PORT = resolvePort();
  const distPath = path.resolve(__dirname, 'dist');
  const isProduction = process.env.NODE_ENV === 'production';

  // CORS headers and preflight handling for cross-device mobile & web access
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Request logger for diagnostic tracing
  app.use((req, _res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[API ${new Date().toISOString()}] ${req.method} ${req.url}`);
    }
    next();
  });

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Initialize Relational SQLite DB and default records
  try {
    await initializeDatabase();
    await seedDatabaseIfEmpty();
    console.log('[SQLite + Drizzle] Database initialized and verified.');
  } catch (error) {
    console.error('[SQLite + Drizzle] Failed to initialize database:', error);
  }

  // Mount API router
  app.use('/api', apiRouter);

  // Vite integration
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Bakery Server] Running at http://0.0.0.0:${PORT} in ${isProduction ? 'production' : 'development'} mode.`);
  });
}

startServer().catch((err) => {
  console.error('[Bakery Server] Fatal startup error:', err);
  process.exit(1);
});
