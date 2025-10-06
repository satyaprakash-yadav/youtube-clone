import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser, useClerk } from "@clerk/nextjs";

import { trpc } from "@/trpc/client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormItem,
    FormField,
    FormControl,
    FormMessage,
} from "@/components/ui/form";

import { UserAvatar } from "@/components/user-avatar";
import { commentsInsertSchema } from "@/db/schema";

const commentFormSchema = commentsInsertSchema.omit({ userId: true });

interface CommentFormProps {
    videoId: string;
    onSuccess?: () => void;
};

export const CommentForm = ({
    videoId,
    onSuccess,
}: CommentFormProps) => {
    const clerk = useClerk();
    const { user } = useUser();

    const utils = trpc.useUtils();
    const create = trpc.comments.create.useMutation({
        onSuccess: () => {
            utils.comments.getMany.invalidate({ videoId });
            form.reset();
            toast.success("Comment added.")
            onSuccess?.();
        },
        onError: (error) => {
            console.log("Something went wrong!");

            if (error.data?.code === "UNAUTHORIZED") {
                clerk.openSignIn();
            };
        },
    });

    const form = useForm<z.infer<typeof commentFormSchema>>({
        resolver: zodResolver(commentFormSchema),
        defaultValues: {
            videoId,
            value: "",
        },
    });

    const onSubmit = (values: z.infer<typeof commentFormSchema>) => {
        create.mutate(values);
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex gap-4 group">
                <UserAvatar
                    size="lg"
                    imageUrl={user?.imageUrl || "/user-placeholder.svg"}
                    name={user?.username || "User"}
                />
                <div className="flex-1">
                    <FormField
                        control={form.control}
                        name="value"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        placeholder="Add a comment..."
                                        className="resize-none bg-transparent overflow-hidden min-h-0 h-15"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="justify-end gap-2 mt-2 flex">
                        <Button
                            disabled={create.isPending}
                            type="submit"
                            size="sm"
                        >
                            Comment
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    );
};
