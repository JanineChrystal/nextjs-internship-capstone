import type React from "react";
import { cn } from "@/lib/utils";

export function BaseCard({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"bg-card text-card-foreground",
				"flex flex-col gap-4 h-full rounded-xl border border-border p-5 shadow-card-base",
				"transition-all duration-200 ease-in-out",
				"hover:scale-[1.02]",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}
