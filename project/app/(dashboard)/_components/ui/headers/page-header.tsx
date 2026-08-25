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
				"bg-card text-card-foreground p-4 sm:p-6 rounded-xl border border-border flex flex-col gap-2 shadow-card-base",
				"transition-all duration-200 ease-in-out",
				// hover scaling constraint - disables scaling animations on mobile where full-bleed headers would cause horizontal scrolling overflow.
				"sm:hover:scale-[1.02]",
				className,
			)}
		>
			{/* breadcrumbs container */}
			{breadcrumbs && <div className="mb-2">{breadcrumbs}</div>}
			{/* title and description block */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 m-0 sm:m-3">
				<div className="w-full min-w-0">
					{/*
					 * responsive typography scaling - scales font sizes across breakpoints to prevent long user-supplied titles from breaking layouts or causing excessive wrapping on small screens.
					 */}
					<h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 text-on-surface tracking-tight wrap-break-word">
						{title}
					</h1>
					{description && (
						<div className="text-xs sm:text-sm text-card-foreground/70 mt-1 w-full max-w-3xl">
							{description}
						</div>
					)}
				</div>
				{topAction && <div className="shrink-0">{topAction}</div>}
			</div>

			{(action || filters) && (
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-2">
					{action && <div className="w-full sm:w-auto">{action}</div>}
					{filters && (
						<div className="flex flex-wrap items-center gap-2">{filters}</div>
					)}
				</div>
			)}

			{children && (
				<div className="flex flex-wrap items-center gap-3 sm:gap-4 mx-0 sm:mx-3">
					{children}
				</div>
			)}
		</div>
	);
}
