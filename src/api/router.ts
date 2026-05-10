import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { executeResearchTask } from './services/hermesService.js';

const t = initTRPC.create();

const sessions: Map<number, { status: string; result?: string; error?: string }> = new Map();

export const appRouter = t.router({
  profiles: t.router({
    list: t.procedure.query(async () => {
      return [];
    }),
    create: t.procedure
      .input(z.object({ name: z.string(), url: z.string(), credentials: z.string().optional() }))
      .mutation(async ({ input }) => {
        return { id: Date.now(), ...input, createdAt: new Date() };
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
        sessions.set(id, { status: 'pending' });
        return { id, profileId: input.profileId, prompt: input.prompt, status: 'pending', url: input.url, createdAt: new Date() };
      }),
    start: t.procedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const session = sessions.get(input.id);
        if (!session) throw new Error('Session not found');
        
        session.status = 'running';
        
        const prompt = `Исследуй сайт. Задача: ${session.prompt || 'Собери данные сайта'}. Используй браузер для навигации. Верни результат в JSON формате.`;
        
        executeResearchTask(input.id, prompt)
          .then(result => {
            if (result.success) {
              session.status = 'completed';
              session.result = result.output;
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
  }),
  reports: t.router({
    get: t.procedure
      .input(z.object({ sessionId: z.number() }).nullish())
      .query(async ({ input }) => {
        if (!input?.sessionId) return [];
        const session = sessions.get(input.sessionId);
        return session?.result ? [{ id: 1, content: session.result }] : [];
      }),
  }),
});

export type AppRouter = typeof appRouter;
