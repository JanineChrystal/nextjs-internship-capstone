"use client";

interface TaskBadgeProps {
	priority: string;
	category: string;
}

export function TaskBadge({ priority, category }: TaskBadgeProps) {
	if (priority === "urgent") {
		return (
			<span className="px-2 py-1 bg-error/10 text-error font-label-sm text-label-sm rounded-md text-[10px] uppercase tracking-wider">
				{priority}
			</span>
		);
	}

	return (
		<span className="px-2 py-1 bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm rounded-md text-[10px] uppercase tracking-wider">
			{category}
		</span>
	);
}
