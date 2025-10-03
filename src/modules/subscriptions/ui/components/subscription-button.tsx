import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "@/components/ui/button";

interface SubscriptionButtonProps {
    onClick: ButtonProps["onClick"];
    disabled: boolean;
    isSubscribed: boolean;
    className?: string;
    size?: ButtonProps["size"];
}

export const SubscriptionButton = ({
    size,
    onClick,
    disabled,
    className,
    isSubscribed,
}: SubscriptionButtonProps) => {
    return (
        <Button
            size={size}
            variant={isSubscribed ? "secondary": "default"}
            className={cn("rounded-full", className)}
            onClick={onClick}
            disabled={disabled}
        >
            {isSubscribed ? "Unsubscribe": "Subscribe"}
        </Button>
    );
};