import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { trpcServer } from '@hono/trpc-server';
import { appRouter } from './api/router.js';
import 'dotenv/config';

const app = new Hono();

app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

app.use('/trpc/*', trpcServer({ router: appRouter }));

app.get('/', (c) => c.json({
  status: 'ok',
  message: 'Hermes Site Research Hub API',
  endpoints: {
    trpc: '/trpc',
  },
}));

app.get('/health', (c) => c.json({ status: 'healthy' }));

export default {
  port: 3000,
  fetch: app.fetch,
};
