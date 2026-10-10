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

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(path.resolve(distPath, 'index.html'));
  const isProduction = process.env.NODE_ENV === 'production' || (hasDist && process.env.NODE_ENV !== 'development');

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
      server: { middlewareMode: true },
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
