import type { LucideIcon } from "lucide-react";
import type React from "react";
import { GradientSurface } from "@/components/ui/surfaces/gradient-surface";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
	icon?: LucideIcon;
	title: string;
	description?: string;
	/** action element - an optional call to action rendered below the description. */
	action?: React.ReactNode;
	/**
	 * subdued styling - renders a plain dashed panel instead of a gradient,
	 * intended for incidental empty states where the lack of content shouldn't
	 * dominate the screen.
	 */
	subdued?: boolean;
	className?: string;
}

/**
 * empty state panel - provides a visually prominent, gradient-backed "nothing
 * here" panel designed to guide the user towards an initial action. Supports
 * a 'subdued' mode for incidental empty states to prevent them from
 * visually overwhelming adjacent content.
 */
export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	subdued,
	className,
}: EmptyStateProps) {
	if (subdued) {
		return (
			<div
				className={cn(
					"flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-8 text-center",
					className,
				)}
			>
				{Icon && <Icon className="mb-3 h-10 w-10 text-secondary" />}
				<h3 className="text-base font-semibold text-foreground">{title}</h3>
				{description && (
					<p className="mt-1 max-w-sm text-sm text-secondary">{description}</p>
				)}
				{action && <div className="mt-4">{action}</div>}
			</div>
		);
	}

	return (
		<GradientSurface
			icon={Icon}
			title={title}
			description={description}
			action={action}
			className={className}
		/>
	);
}
