import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();

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
      .input(z.object({ profileId: z.number().optional() }))
      .query(async () => {
        return [];
      }),
    create: t.procedure
      .input(z.object({ profileId: z.number(), prompt: z.string() }))
      .mutation(async ({ input }) => {
        return {
          id: Date.now(),
          profileId: input.profileId,
          prompt: input.prompt,
          status: 'pending',
          createdAt: new Date(),
        };
      }),
    start: t.procedure
      .input(z.object({ id: z.number() }))
      .mutation(async () => {
        return { success: true, status: 'started' };
      }),
    get: t.procedure
      .input(z.object({ id: z.number() }))
      .query(async () => {
        return null;
      }),
  }),
  reports: t.router({
    get: t.procedure
      .input(z.object({ sessionId: z.number() }))
      .query(async () => {
        return [];
      }),
  }),
});

export type AppRouter = typeof appRouter;
