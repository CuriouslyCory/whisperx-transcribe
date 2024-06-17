import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
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

  getAllConversations: publicProcedure.query(async ({ ctx }) => {
    const conversations = await ctx.db
      .select({
        sessionId: transcripts.sessionId,
        conversation: transcripts.conversation,
      })
      .from(transcripts)
      .groupBy(sql`"sessionId", "conversation"`);
    return conversations;
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number().min(1) }))
    .query(async ({ input, ctx }) => {
      const records = await ctx.db.query.transcripts.findFirst({
        where: and(eq(transcripts.id, input.id)),
      });

      return records;
    }),

  getByIndex: publicProcedure
    .input(z.object({ id: z.number().min(1) }))
    .query(async ({ input, ctx }) => {
      const conversation = await ctx.db
        .select({
          sessionId: transcripts.sessionId,
          conversation: transcripts.conversation,
        })
        .from(transcripts)
        .groupBy(sql`${transcripts.sessionId}, ${transcripts.conversation}`)
        .limit(1)
        .offset(input.id);

      if (!conversation[0]) {
        return null;
      }

      const records = await ctx.db.query.transcripts.findMany({
        where: and(
          eq(transcripts.sessionId, conversation[0].sessionId),
          eq(transcripts.conversation, conversation[0].conversation),
        ),
        orderBy: (transcripts, { asc }) => [asc(transcripts.startTime)],
      });

      return records;
    }),

  deleteConversation: publicProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        conversation: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { sessionId, conversation } = input;

      return await ctx.db
        .delete(transcripts)
        .where(
          and(
            eq(transcripts.sessionId, sessionId),
            eq(transcripts.conversation, conversation),
          ),
        );
    }),

  deleteByIds: publicProcedure
    .input(z.array(z.number().min(1)))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .delete(transcripts)
        .where(inArray(transcripts.id, input))
        .returning();
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

  switchSpeakerName: publicProcedure
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
  updateSpeakerByIds: publicProcedure
    .input(
      z.object({
        newSpeakerName: z.string().max(255),
        transcriptIds: z.array(z.number().min(1)),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { newSpeakerName, transcriptIds } = input;
      const result = await ctx.db
        .update(transcripts)
        .set({ speaker: newSpeakerName })
        .where(and(inArray(transcripts.id, transcriptIds)))
        .returning();
      return result;
    }),
});
