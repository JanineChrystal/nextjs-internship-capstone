"use client";

import { X } from "lucide-react";
import type React from "react";
import { cn } from "@/lib/utils";

interface FilterChipProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	label: string;
	isActive?: boolean;
	onRemove?: () => void;
}

export function FilterChip({
	label,
	isActive,
	onRemove,
	onClick,
	className,
	...props
}: FilterChipProps) {
	// Removal tags
	if (onRemove) {
		return (
			<div
				className={cn(
					"inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors",
					"bg-primary text-primary-foreground border-primary",
					className,
				)}
			>
				<span>{label}</span>
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onRemove();
					}}
					className="hover:bg-black/20 dark:hover:bg-white/20 rounded-full p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
					aria-label="Remove filter"
				>
					<X className="w-3 h-3" />
				</button>
			</div>
		);
	}

	// Standard Toggle
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors",
				isActive
					? "bg-primary text-primary-foreground border-primary hover:opacity-90"
					: "bg-card text-card-foreground border-border hover:bg-accent hover:text-accent-foreground",
				className,
			)}
			{...props}
		>
			{label}
		</button>
	);
}
