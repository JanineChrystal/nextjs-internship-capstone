"use client";

import type * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const MEMBER_AVATAR_SIZES = {
	xs: { root: "size-6", fallback: "text-[10px]" },
	sm: { root: "size-8", fallback: "text-xs" },
	md: { root: "size-9", fallback: "text-sm" },
	lg: { root: "size-10", fallback: "text-base" },
} as const;

export type MemberAvatarSize = keyof typeof MEMBER_AVATAR_SIZES;

interface MemberAvatarProps
	extends Omit<React.ComponentProps<typeof Avatar>, "size" | "children"> {
	name: string;
	avatarUrl?: string | null;
	size?: MemberAvatarSize;
	fallbackClassName?: string;
}

function getInitial(name: string): string {
	return name.trim().charAt(0).toUpperCase() || "?";
}

/**
 * member avatar - a unified avatar component providing consistent sizes,
 * guaranteed fallbacks, and proper image fitting across the application,
 * eliminating the visual drift of disparate implementations.
 */
export function MemberAvatar({
	name,
	avatarUrl,
	size = "sm",
	className,
	fallbackClassName,
	...props
}: MemberAvatarProps) {
	const sizeClasses = MEMBER_AVATAR_SIZES[size];

	return (
		<Avatar className={cn(sizeClasses.root, className)} {...props}>
			{avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
			<AvatarFallback
				className={cn(
					"bg-primary/20 font-bold text-primary",
					sizeClasses.fallback,
					fallbackClassName,
				)}
			>
				{getInitial(name)}
			</AvatarFallback>
		</Avatar>
	);
}
