import { z } from "zod";

import { db } from "@/index";
import { comments, users } from "@/db/schema";

import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { and, count, desc, eq, getTableColumns, lt, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const commentsRouter = createTRPCRouter({
    remove: protectedProcedure
        .input(z.object({
            id: z.uuid(),
        }))
        .mutation(async ({ input, ctx }) => {
            const { id } = input;
            const { id: userId } = ctx.user;

            const [deletedComments] = await db
                .delete(comments)
                .where(and(
                    eq(comments.id, id),
                    eq(comments.userId, userId),
                ))
                .returning();

            if (!deletedComments) {
                throw new TRPCError({ code: "NOT_FOUND" });
            };

            return deletedComments;
        }),
    create: protectedProcedure
        .input(z.object({
            videoId: z.uuid(),
            value: z.string(),
        }))
        .mutation(async ({ input, ctx }) => {
            const { videoId, value } = input;
            const { id: userId } = ctx.user;

            const [createdComments] = await db
                .insert(comments)
                .values({ userId, videoId, value })
                .returning();

            return createdComments;
        }),
    getMany: baseProcedure
        .input(
            z.object({
                videoId: z.uuid(),
                cursor: z.object({
                    id: z.uuid(),
                    updatedAt: z.date(),
                }).nullish(),
                limit: z.number().min(1).max(100),
            }),
        )
        .query(async ({ input }) => {
            const { videoId, cursor, limit } = input;

            const [totalData, data] = await Promise.all([
                db
                    .select({
                        count: count(),
                    })
                    .from(comments)
                    .where(eq(comments.videoId, videoId)),

                db
                    .select({
                        ...getTableColumns(comments),
                        user: users,
                        // totalCount: db.$count(comments, eq(comments.videoId, videoId))
                    })
                    .from(comments)
                    .where(and(
                        eq(comments.videoId, videoId),
                        cursor
                            ? or(
                                lt(comments.updatedAt, cursor.updatedAt),
                                and(
                                    eq(comments.updatedAt, cursor.updatedAt),
                                    lt(comments.id, cursor.id)
                                )
                            )
                            : undefined,
                    ))
                    .innerJoin(users, eq(comments.userId, users.id))
                    .orderBy(desc(comments.updatedAt), desc(comments.id))
                    .limit(limit + 1)
            ])

            const hasMore = data.length > limit;
            // Remove the last item if there is more data
            const items = hasMore ? data.slice(0, -1) : data;
            // Set the next cursor to the last item if there is more data
            const lastItem = items[items.length - 1];
            const nextCursor = hasMore
                ? {
                    id: lastItem.id,
                    updatedAt: lastItem.updatedAt,
                }
                : null;

            return {
                totalCount: totalData[0].count,
                items,
                nextCursor,
            };
        }),
});
