import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
	icon?: LucideIcon;
	title: string;
	description?: string;
}

export function EmptyState({
	icon: Icon,
	title,
	description,
}: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center p-8 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
			{Icon && <Icon className="h-10 w-10 text-secondary mb-3" />}
			<h3 className="text-base font-semibold text-foreground">{title}</h3>
			{description && (
				<p className="text-sm text-secondary max-w-sm mt-1">{description}</p>
			)}
		</div>
	);
}
