"use client";

import { trpc } from "@/trpc/client";

import { DEFAULT_LIMIT } from "@/constants";

export const VideosSection = () => {
    const [data] = trpc.studio.getMany.useSuspenseInfiniteQuery({
        limit: DEFAULT_LIMIT,
    }, {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

    return (
        <div className="">
            {JSON.stringify(data, null, 2)}
        </div>
    );
};
