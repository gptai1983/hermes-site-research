import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { executeResearchTask } from './services/hermesService.js';

const t = initTRPC.create();

const sessions: Map<number, { status: string; result?: string; error?: string; prompt?: string; logs?: string[] }> = new Map();
const reports: Map<number, { content: string }> = new Map();

export const appRouter = t.router({
  profiles: t.router({
    list: t.procedure.query(async () => {
      return [];
    }),
    create: t.procedure
      .input(z.object({ name: z.string(), url: z.string(), credentials: z.string().optional() }))
      .mutation(async ({ input }) => {
        const id = Date.now();
        return { id, name: input.name, url: input.url, createdAt: new Date() };
      }),
    delete: t.procedure
      .input(z.object({ id: z.number() }))
      .mutation(async () => {
        return { success: true };
      }),
  }),
  sessions: t.router({
    list: t.procedure
      .input(z.object({ profileId: z.number().optional() }).nullish())
      .query(async () => {
        return Array.from(sessions.entries()).map(([id, data]) => ({ id, ...data }));
      }),
    create: t.procedure
      .input(z.object({ profileId: z.number(), prompt: z.string(), url: z.string().optional() }))
      .mutation(async ({ input }) => {
        const id = Date.now();
        sessions.set(id, { status: 'pending', prompt: input.prompt, logs: [] });
        return { id, profileId: input.profileId, prompt: input.prompt, status: 'pending', url: input.url, createdAt: new Date() };
      }),
    start: t.procedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const session = sessions.get(input.id);
        if (!session) throw new Error('Session not found');
        
        session.status = 'running';
        
        executeResearchTask(input.id, session.prompt || 'Ответь кратко', (log) => {
          if (!session.logs) session.logs = [];
          session.logs.push(log);
        })
          .then(result => {
            if (result.success) {
              session.status = 'completed';
              session.result = result.output;
              reports.set(input.id, { content: result.output || '' });
            } else {
              session.status = 'failed';
              session.error = result.error;
            }
          })
          .catch(err => {
            session.status = 'failed';
            session.error = err.message;
          });
        
        return { success: true, status: 'started' };
      }),
    get: t.procedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return sessions.get(input.id) || null;
      }),
    logs: t.procedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const session = sessions.get(input.id);
        return session?.logs || [];
      }),
  }),
  reports: t.router({
    get: t.procedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        const report = reports.get(input.sessionId);
        return report ? [{ id: input.sessionId, content: report.content }] : [];
      }),
  }),
});

export type AppRouter = typeof appRouter;
