import type React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
	title: string;
	description?: string;
	action?: React.ReactNode;
	filters?: React.ReactNode;
}

export function PageHeader({
	title,
	description,
	action,
	filters,
}: PageHeaderProps) {
	return (
		<div
			className={cn(
				"bg-card text-card-foreground p-6 rounded-xl border border-border flex flex-col gap-4 shadow-card-base",
				"transition-all duration-200 ease-in-out",
				"hover:scale-[1.02]",
			)}
		>
			{/* Top Row: Title, Description, and Action Button */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
				<div>
					<h1 className="text-5xl font-bold mb-3">{title}</h1>
					{description && (
						<p className="text-sm text-card-foreground/70 mt-1">
							{description}
						</p>
					)}
				</div>
			</div>

			<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
				{/* Render the action button slot if it exists */}
				{action && <div className="w-full sm:w-auto">{action}</div>}

				{/* Bottom Row: Filters */}
				{filters && (
					<>
						<hr className="w-full border-border sm:hidden" />
						<div className="hidden sm:block w-px h-8 bg-border" />
						<div className="flex flex-wrap items-center gap-2">{filters}</div>
					</>
				)}
			</div>
		</div>
	);
}
