import { cn } from "@/lib/utils";
import { getCategoryBadgeStyle, getDynamicBadgeColor } from "@/lib/utils/badge";
import { TAG_CONFIG } from "../../../projects/_constants/badges";

interface TagBadgeProps {
	tag: string;
	/** tag color - optional hex color provided by the caller to avoid unnecessary database lookups for system tags like roles. */
	color?: string | null;
	className?: string;
}

export function TagBadge({ tag, color, className }: TagBadgeProps) {
	const inlineStyle = getCategoryBadgeStyle(color);

	// color fallback - relies on static maps or hashing for non-category tags and unhydrated categories to prevent colorless flashes.
	const colorClass = inlineStyle
		? undefined
		: TAG_CONFIG[tag] || getDynamicBadgeColor(tag);

	return (
		<div
			className={cn(
				"inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap border",
				colorClass,
				className,
			)}
			style={inlineStyle}
		>
			{tag}
		</div>
	);
}
