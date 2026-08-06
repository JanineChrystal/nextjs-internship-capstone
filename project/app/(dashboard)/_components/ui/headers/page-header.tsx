import type React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
	breadcrumbs?: React.ReactNode;
	title: React.ReactNode;
	description?: React.ReactNode;
	topAction?: React.ReactNode;
	action?: React.ReactNode;
	filters?: React.ReactNode;
	children?: React.ReactNode;
	className?: string;
}

export function PageHeader({
	breadcrumbs,
	title,
	description,
	topAction,
	action,
	filters,
	children,
	className,
}: PageHeaderProps) {
	return (
		<div
			className={cn(
				"bg-card text-card-foreground p-6 rounded-xl border border-border flex flex-col gap-2 shadow-card-base",
				"transition-all duration-200 ease-in-out",
				"hover:scale-[1.02]",
				className,
			)}
		>
			{/* Breadcrumbs Slot */}
			{breadcrumbs && <div className="mb-2">{breadcrumbs}</div>}
			{/* Title and Description */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
				<div className="w-full">
					<h1 className="text-5xl font-bold mb-3 text-on-surface tracking-tight">
						{title}
					</h1>
					{description && (
						<div className="text-sm text-card-foreground/70 mt-1 w-full max-w-3xl">
							{description}
						</div>
					)}
				</div>
				{topAction && <div className="shrink-0">{topAction}</div>}
			</div>

			<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
				{action && <div className="w-full sm:w-auto">{action}</div>}
				{filters && (
					<div className="flex flex-wrap items-center gap-2">{filters}</div>
				)}
			</div>

			{children && (
				<div className="flex flex-wrap items-center gap-4 mt-2">{children}</div>
			)}
		</div>
	);
}
