"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import { MemberAvatar } from "@/components/ui/member-avatar";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface MemberAvatarChipProps {
	name: string;
	avatarUrl?: string;
	size?: "sm" | "md";
	onRemove?: () => void;
	className?: string;
}

export function MemberAvatarChip({
	name,
	avatarUrl,
	size = "md",
	onRemove,
	className,
}: MemberAvatarChipProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className={cn("relative group shrink-0", className)}>
					<MemberAvatar
						name={name}
						avatarUrl={avatarUrl}
						size={size}
						className="border border-outline-variant"
						fallbackClassName="bg-surface-container-high font-medium text-on-surface"
					/>

					{onRemove && (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={onRemove}
							className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 rounded-full bg-surface border border-outline-variant text-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:text-error hover:bg-error/10 p-0"
							aria-label={`Remove ${name}`}
						>
							<X className="h-2.5 w-2.5" />
						</Button>
					)}
				</div>
			</TooltipTrigger>
			<TooltipContent>{name}</TooltipContent>
		</Tooltip>
	);
}
