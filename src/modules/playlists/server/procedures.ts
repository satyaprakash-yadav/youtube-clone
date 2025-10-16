import { and, desc, eq, getTableColumns, lt, or } from "drizzle-orm";

import z from "zod";
import { db } from "@/index";
import { playlists, playlistVideos, users, videoReactions, videos, videoViews } from "@/db/schema";
import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

export const playlistsRouter = createTRPCRouter({
    getMany: protectedProcedure
        .input(
            z.object({
                cursor: z.object({
                    id: z.uuid(),
                    updatedAt: z.date(),
                })
                    .nullish(),
                limit: z.number().min(1).max(100),
            }),
        )
        .query(async ({ input, ctx }) => {
            const { id: userId } = ctx.user;
            const { cursor, limit } = input;

            const data = await db
                .select({
                    ...getTableColumns(playlists),
                    videoCount: db.$count(
                        playlistVideos,
                        eq(playlists.id, playlistVideos.playlistId)
                    ),
                    user: users,
                })
                .from(playlists)
                .innerJoin(users, eq(playlists.userId, users.id))
                .where(and(
                    eq(playlists.userId, userId),
                    cursor
                        ? or(
                            lt(playlists.updatedAt, cursor.updatedAt),
                            and(
                                eq(playlists.updatedAt, cursor.updatedAt),
                                lt(playlists.id, cursor.id),
                            )
                        )
                        : undefined,
                )).orderBy(desc(playlists.updatedAt), desc(playlists.id))
                .limit(limit + 1)   // Add 1 to the limit to check if there is more data

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
                items,
                nextCursor,
            };
        }),
    create: protectedProcedure
        .input(z.object({ name: z.string().min(1) }))
        .mutation(async ({ input, ctx }) => {
            const { id: userId } = ctx.user;
            const { name } = input;

            const [createdPlaylist] = await db
                .insert(playlists)
                .values({
                    userId,
                    name,
                })
                .returning();

            if (!createdPlaylist) {
                throw new TRPCError({ code: "BAD_REQUEST" });
            };

            return createdPlaylist;
        }),
    getManyLiked: protectedProcedure
        .input(
            z.object({
                cursor: z.object({
                    id: z.uuid(),
                    LikedAt: z.date(),
                })
                    .nullish(),
                limit: z.number().min(1).max(100),
            }),
        )
        .query(async ({ input, ctx }) => {
            const { id: userId } = ctx.user;
            const { cursor, limit } = input;

            const viewerVideoReactions = db.$with("viewer_video_reactions").as(
                db
                    .select({
                        videoId: videoReactions.videoId,
                        LikedAt: videoReactions.updatedAt,
                    })
                    .from(videoReactions)
                    .where(and(
                        eq(videoReactions.userId, userId),
                        eq(videoReactions.type, "like"),
                    ))
            );

            const data = await db
                .with(viewerVideoReactions)
                .select({
                    ...getTableColumns(videos),
                    user: users,
                    LikedAt: viewerVideoReactions.LikedAt,
                    viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
                    likeCount: db.$count(videoReactions, and(
                        eq(videoReactions.videoId, videos.id),
                        eq(videoReactions.type, "like"),
                    )),
                    dislikeCount: db.$count(videoReactions, and(
                        eq(videoReactions.videoId, videos.id),
                        eq(videoReactions.type, "dislike"),
                    )),
                })
                .from(videos)
                .innerJoin(users, eq(videos.userId, users.id))
                .innerJoin(viewerVideoReactions, eq(videos.id, viewerVideoReactions.videoId))
                .where(and(
                    eq(videos.visibility, "public"),
                    cursor
                        ? or(
                            lt(viewerVideoReactions.LikedAt, cursor.LikedAt),
                            and(
                                eq(viewerVideoReactions.LikedAt, cursor.LikedAt),
                                lt(videos.id, cursor.id),
                            )
                        )
                        : undefined,
                )).orderBy(desc(viewerVideoReactions.LikedAt), desc(videos.id))
                .limit(limit + 1)   // Add 1 to the limit to check if there is more data

            const hasMore = data.length > limit;
            // Remove the last item if there is more data
            const items = hasMore ? data.slice(0, -1) : data;
            // Set the next cursor to the last item if there is more data
            const lastItem = items[items.length - 1];
            const nextCursor = hasMore
                ? {
                    id: lastItem.id,
                    LikedAt: lastItem.LikedAt,
                }
                : null;

            return {
                items,
                nextCursor,
            };
        }),
    getManyHistory: protectedProcedure
        .input(
            z.object({
                cursor: z.object({
                    id: z.uuid(),
                    viewedAt: z.date(),
                })
                    .nullish(),
                limit: z.number().min(1).max(100),
            }),
        )
        .query(async ({ input, ctx }) => {
            const { id: userId } = ctx.user;
            const { cursor, limit } = input;

            const viewerVideoViews = db.$with("viewer_video_views").as(
                db
                    .select({
                        videoId: videoViews.videoId,
                        viewedAt: videoViews.updatedAt,
                    })
                    .from(videoViews)
                    .where(eq(videoViews.userId, userId))
            );

            const data = await db
                .with(viewerVideoViews)
                .select({
                    ...getTableColumns(videos),
                    user: users,
                    viewedAt: viewerVideoViews.viewedAt,
                    viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
                    likeCount: db.$count(videoReactions, and(
                        eq(videoReactions.videoId, videos.id),
                        eq(videoReactions.type, "like"),
                    )),
                    dislikeCount: db.$count(videoReactions, and(
                        eq(videoReactions.videoId, videos.id),
                        eq(videoReactions.type, "dislike"),
                    )),
                })
                .from(videos)
                .innerJoin(users, eq(videos.userId, users.id))
                .innerJoin(viewerVideoViews, eq(videos.id, viewerVideoViews.videoId))
                .where(and(
                    eq(videos.visibility, "public"),
                    cursor
                        ? or(
                            lt(viewerVideoViews.viewedAt, cursor.viewedAt),
                            and(
                                eq(viewerVideoViews.viewedAt, cursor.viewedAt),
                                lt(videos.id, cursor.id),
                            )
                        )
                        : undefined,
                )).orderBy(desc(viewerVideoViews.viewedAt), desc(videos.id))
                .limit(limit + 1)   // Add 1 to the limit to check if there is more data

            const hasMore = data.length > limit;
            // Remove the last item if there is more data
            const items = hasMore ? data.slice(0, -1) : data;
            // Set the next cursor to the last item if there is more data
            const lastItem = items[items.length - 1];
            const nextCursor = hasMore
                ? {
                    id: lastItem.id,
                    viewedAt: lastItem.viewedAt,
                }
                : null;

            return {
                items,
                nextCursor,
            };
        }),
});
