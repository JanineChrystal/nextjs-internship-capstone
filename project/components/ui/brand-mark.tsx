import { cn } from "@/lib/utils";

/**
 * brand mark - centralizes the placeholder logo rendering to prevent
 * visual drift across the app. Built via CSS rather than an image to
 * ensure infinite scaling and seamless adaptation to theme variables.
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
