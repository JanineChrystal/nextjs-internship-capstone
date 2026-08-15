"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/buttons/button";
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

const SIZE_CLASSES = {
	sm: "h-7 w-7 text-xs",
	md: "h-9 w-9 text-sm",
};

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
					<div
						className={cn(
							"rounded-full overflow-hidden border border-outline-variant bg-surface-container-high flex items-center justify-center font-medium text-on-surface",
							SIZE_CLASSES[size],
						)}
					>
						{avatarUrl ? (
							<Image
								src={avatarUrl}
								alt={name}
								width={36}
								height={36}
								className="h-full w-full object-cover"
							/>
						) : (
							<span>{name.charAt(0).toUpperCase()}</span>
						)}
					</div>

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
