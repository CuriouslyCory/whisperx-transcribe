import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { transcripts } from "~/server/db/schema";

export const transcriptsRouter = createTRPCRouter({
  getLatest: publicProcedure.query(async ({ ctx }) => {
    const latest = await ctx.db.query.transcripts.findFirst({
      columns: { sessionId: true, conversation: true } as const,
      orderBy: (transcripts, { desc }) => [desc(transcripts.id)],
    });
    if (!latest) {
      return null;
    }
    const records = await ctx.db.query.transcripts.findMany({
      where: and(
        eq(transcripts.sessionId, latest.sessionId),
        eq(transcripts.conversation, latest.conversation),
      ),
    });
    return records;
  }),

  getByIndex: publicProcedure
    .input(z.object({ id: z.number().min(1) }))
    .query(async ({ input, ctx }) => {
      const conversation = await ctx.db.query.conversations.findFirst({
        where: and(eq(transcripts.id, input.id)),
      });

      if (!conversation) {
        return null;
      }

      const records = await ctx.db.query.transcripts.findMany({
        where: and(
          eq(transcripts.sessionId, conversation.sessionId),
          eq(transcripts.conversation, conversation.conversation),
        ),
        orderBy: (transcripts, { asc }) => [asc(transcripts.startTime)],
      });

      return records;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number().min(1),
        sessionId: z.string().uuid(),
        conversation: z.number(),
        speaker: z.string().max(255),
        date: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        duration: z.string(),
        content: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const result = await ctx.db
        .update(transcripts)
        .set(updateData)
        .where(eq(transcripts.id, id))
        .returning();

      return result[0];
    }),

  updateSpeaker: publicProcedure
    .input(
      z.object({
        currentSpeakerName: z.string().max(255),
        newSpeakerName: z.string().max(255),
        sessionId: z.string().uuid(),
        conversation: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { currentSpeakerName, newSpeakerName, sessionId, conversation } =
        input;
      const result = await ctx.db
        .update(transcripts)
        .set({ speaker: newSpeakerName })
        .where(
          and(
            eq(transcripts.sessionId, sessionId),
            eq(transcripts.conversation, conversation),
            eq(transcripts.speaker, currentSpeakerName),
          ),
        )
        .returning();
      return result;
    }),
});
