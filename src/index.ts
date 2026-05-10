import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { trpcServer } from '@hono/trpc-server';
import { appRouter } from './api/router.js';
import 'dotenv/config';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  credentials: true,
}));

app.use('/trpc/*', trpcServer({ router: appRouter }));

app.get('/', (c) => c.json({
  status: 'ok',
  message: 'Hermes Site Research Hub API',
}));

app.get('/health', (c) => c.json({ status: 'healthy' }));

console.log('Server starting on http://0.0.0.0:3000');
serve({
  fetch: app.fetch,
  port: 3000,
});
