import type React from "react";
import { cn } from "@/lib/utils";

export interface ToolbarProps {
	leftSection?: React.ReactNode;
	rightSection?: React.ReactNode;
	children?: React.ReactNode;
	className?: string;
}

export function Toolbar({
	leftSection,
	rightSection,
	children,
	className,
}: ToolbarProps) {
	return (
		<div
			className={cn(
				"flex flex-col md:flex-row md:items-center justify-between gap-4 w-full",
				className,
			)}
		>
			{leftSection}

			{(rightSection || children) && (
				<div className="flex flex-wrap items-center gap-3 shrink-0">
					{rightSection}
					{children}
				</div>
			)}
		</div>
	);
}
