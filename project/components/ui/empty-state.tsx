import type { LucideIcon } from "lucide-react";
import type React from "react";
import { GradientSurface } from "@/components/ui/surfaces/gradient-surface";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
	icon?: LucideIcon;
	title: string;
	description?: string;
	/** A call to action. Rendered inside the panel, below the description. */
	action?: React.ReactNode;
	/**
	 * Draws the plain dashed panel instead of the gradient one.
	 *
	 * For an empty state that is not the point of its screen - an empty column
	 * on a board beside five full ones, a filtered list that matched nothing.
	 * Those are incidental, and a gradient panel would make the emptiest part of
	 * the page the loudest.
	 */
	subdued?: boolean;
	className?: string;
}

/**
 * The "nothing here yet" panel.
 *
 * It carries the gradient by default because an empty state is the one moment a
 * screen has nothing else to say - there is no content competing with it, and it
 * is usually asking for an action. That is exactly the case the reference sheet
 * designed its glassmorphic card for, and it is the surface where a gradient
 * costs nothing and earns the most.
 *
 * `subdued` exists so this stays true. The moment an empty state is a small part
 * of a fuller screen, the gradient is wrong, and having the escape hatch here
 * means the answer is a prop rather than a second component that drifts.
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
