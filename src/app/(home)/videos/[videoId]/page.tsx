import { VideoView } from "@/modules/videos/ui/views/video-view";
import { HydrateClient, trpc } from "@/trpc/server";

interface Props {
    params: Promise<{
        videoId: string;
    }>;
};

const Page = async ({ params }: Props) => {
    const { videoId } = await params;

    void trpc.videos.getOne.prefetch({ id: videoId });
    // TODO: don't forget to change to 'prefetchInfinite'
    void trpc.comments.getMany.prefetch({ videoId: videoId });

    return ( 
        <HydrateClient>
            <VideoView videoId={videoId} />
        </HydrateClient>
    );
};
 
export default Page;