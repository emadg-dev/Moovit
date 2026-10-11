import express from 'express';
import dotenv from 'dotenv';
import { initDatabase } from './db';
import { startScheduler } from './scheduler';
import { apiRouter } from './routes';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

async function bootstrap() {
  const app = express();

  // Native lightweight CORS middleware
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', CLIENT_ORIGIN);
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (_req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json());

  // Initialize SQLite database takoon-bede.sqlite
  await initDatabase();

  // Start persistent background push scheduler
  startScheduler(60000);

  // Mount API
  app.use('/api', apiRouter);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Takoon Bede Backend] Listening on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal backend startup error:', err);
  process.exit(1);
});
