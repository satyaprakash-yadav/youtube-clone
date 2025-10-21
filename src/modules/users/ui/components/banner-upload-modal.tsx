"use client";

// import "@uploadthing/react/styles.css";
import { trpc } from "@/trpc/client";
import { ResponsiveModal } from "@/components/responsive-modal";

import { UploadDropzone } from "@/lib/uploadthing";

interface BannerUploadModalProps {
    userId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export const BannerUploadModal = ({
    open,
    userId,
    onOpenChange,
}: BannerUploadModalProps) => {
    const utils = trpc.useUtils();

    const onUploadComplete = () => {
        utils.users.getOne.invalidate({ id: userId });
        onOpenChange(false);
    };

    return (
        <ResponsiveModal
            title="Upload a banner"
            open={open}
            onOpenChange={onOpenChange}
        >
            <UploadDropzone
                className="mt-4 ut-button:bg-red-500 ut-button:ut-readying:bg-red-500/50 pb-10"
                endpoint="bannerUploader"
                onClientUploadComplete={onUploadComplete}
            />
        </ResponsiveModal>
    );
};
