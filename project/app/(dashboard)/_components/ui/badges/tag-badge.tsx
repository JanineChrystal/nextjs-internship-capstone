import { cn } from "@/lib/utils";
import {
	getCategoryBadgeStyle,
	getDynamicBadgeColor,
	TAG_CONFIG,
} from "../../../projects/_constants/badges";

interface TagBadgeProps {
	tag: string;
	/**
	 * A hex colour a user picked for this tag, when one exists. Supplied by the
	 * caller rather than looked up here: this badge also renders job roles and
	 * access levels, which have no colour row and must not pay for a lookup.
	 */
	color?: string | null;
	className?: string;
}

export function TagBadge({ tag, color, className }: TagBadgeProps) {
	const inlineStyle = getCategoryBadgeStyle(color);

	// The static map and the hash are the fallback, not the rule. They still
	// serve every tag that is not a user-created category - and a category whose
	// row has not loaded yet, which keeps the badge from flashing colourless.
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
