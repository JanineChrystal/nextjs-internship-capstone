import { cn } from "@/lib/utils";

/**
 * The "T" tile that stands in for a logo.
 *
 * ## Why a component rather than the same markup twice
 *
 * This mark appears in the dashboard sidebar and above the sign-in form. When
 * it was written inline in both, the two drifted immediately - different sizes,
 * and the sidebar's version was painted with a hard-coded `#0D47A1` while
 * nothing else in the app used a literal colour. One component means the brand
 * changes in one place, which matters more than usual here: this is a
 * placeholder, and placeholders are supposed to be easy to replace.
 *
 * ## Why it is not an image
 *
 * A drawn tile has no file to download, scales to any size without blurring,
 * and takes its colour from `--primary` - so it follows dark mode now and the
 * Phase 7 palettes later. An image cannot do the last of those.
 */
export function BrandMark({
	className,
	letterClassName,
}: {
	/** Sizing for the tile. Defaults to 32px, the sidebar's size. */
	className?: string;
	/** Sizing for the letter, which does not scale with the tile on its own. */
	letterClassName?: string;
}) {
	return (
		<span
			aria-hidden="true"
			className={cn(
				"grid aspect-square size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground",
				className,
			)}
		>
			<span className={cn("font-bold text-lg leading-none", letterClassName)}>
				T
			</span>
		</span>
	);
}
