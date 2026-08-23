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
				// Not below `sm`. The header is full-bleed on a phone, so scaling it
				// up pushes its edges past the viewport and the page gains a
				// horizontal scrollbar on hover. There is no hover on a touch screen
				// to justify the cost anyway.
				"sm:hover:scale-[1.02]",
				className,
			)}
		>
			{/* Breadcrumbs Slot */}
			{breadcrumbs && <div className="mb-2">{breadcrumbs}</div>}
			{/* Title and Description */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 m-0 sm:m-3">
				<div className="w-full min-w-0">
					{/*
					 * Four steps rather than one fixed size. `text-5xl` is 48px, which
					 * on a 360px screen gives about seven characters a line - a project
					 * name became a five-line wall before the description started.
					 *
					 * `wrap-break-word` because titles here are user-supplied: a long
					 * unbroken project name has no space to wrap at and would otherwise
					 * widen the card past the viewport.
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
