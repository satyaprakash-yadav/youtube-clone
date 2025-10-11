import { HydrateClient, trpc } from "@/trpc/server";

import { StudioView } from "@/modules/studio/views/studio-view";

import { DEFAULT_LIMIT } from "@/constants";

export const dynamic = "force-dynamic";

const Page = async () => {
    void trpc.studio.getMany.prefetchInfinite({
        limit: DEFAULT_LIMIT,
    });

    return ( 
        <HydrateClient>
            <StudioView />
        </HydrateClient>
    );
};
 
export default Page;
