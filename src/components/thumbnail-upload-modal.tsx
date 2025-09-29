"use client";

// import "@uploadthing/react/styles.css";
import { trpc } from "@/trpc/client";
import { ResponsiveModal } from "./responsive-modal";

import { UploadDropzone } from "@/lib/uploadthing";

interface ThumbnailUploadModalProps {
    videoId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export const ThumbnailUploadModal = ({
    open,
    videoId,
    onOpenChange,
}: ThumbnailUploadModalProps) => {
    const utils = trpc.useUtils();

    const onUploadComplete = () => {
        utils.studio.getMany.invalidate();
        utils.studio.getOne.invalidate({ id: videoId });
        onOpenChange(false);
    };

    return (
        <ResponsiveModal
            title="Upload a thumbnail"
            open={open}
            onOpenChange={onOpenChange}
        >
            <UploadDropzone
                className="mt-4 ut-button:bg-red-500 ut-button:ut-readying:bg-red-500/50 pb-10"
                endpoint="thumbnailUploader"
                input={{ videoId }}
                onClientUploadComplete={onUploadComplete}
            />
        </ResponsiveModal>
    );
};
