import { DEFAULT_LIMIT } from "@/constants";

import { VideosView } from "@/modules/playlists/ui/views/videos-view";

import { HydrateClient, trpc } from "@/trpc/server";

export const dynamic = "force-dynamic";

interface Props {
    params: Promise<{ playlistId: string }>;
};

const Page = async ({ params }: Props) => {
    const { playlistId } = await params;

    void trpc.playlists.getOne.prefetch({ id: playlistId });
    void trpc.playlists.getVideos.prefetchInfinite({
        playlistId,
        limit: DEFAULT_LIMIT,
    });

    return (
        <HydrateClient>
            <VideosView playlistId={playlistId} />
        </HydrateClient>
    );
};

export default Page;
