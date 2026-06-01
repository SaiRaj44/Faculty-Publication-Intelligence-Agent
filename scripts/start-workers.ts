import { enrichmentWorker } from '../workers/enrichmentWorker';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables manually since this runs outside Next.js
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

console.log('--- Starting All BullMQ Background Workers ---');

// The worker itself immediately connects to Redis and begins listening when imported/instantiated.
// We just need to keep the Node process alive.

process.on('SIGINT', async () => {
  console.log('Gracefully shutting down workers...');
  await enrichmentWorker.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Gracefully shutting down workers...');
  await enrichmentWorker.close();
  process.exit(0);
});
