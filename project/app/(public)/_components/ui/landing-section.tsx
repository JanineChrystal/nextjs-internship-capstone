import type { ReactNode } from "react";
import { SectionTitle } from "@/components/ui/sections";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

interface LandingSectionProps {
	/** Must match an id in _constants/nav.ts - the nav and the spy both use it. */
	id: string;
	title?: string;
	description?: string;
	children: ReactNode;
	className?: string;
	/** Headings are centred by default; the workflow rail wants them left. */
	align?: "center" | "left";
}

/**
 * The frame every landing section sits in.
 *
 * Three things are the same for all of them and so belong here rather than
 * repeated eleven times: the anchor id the navigation scrolls to, the vertical
 * rhythm, and `scroll-mt` - without which every anchor lands with its heading
 * hidden behind the sticky header, which is the single most common bug in a
 * one-page site with a fixed navbar.
 *
 * The heading itself reuses the app's existing `SectionTitle` rather than a new
 * marketing-only heading component. It already handles the title/description
 * pair and takes class overrides for size and alignment, so a second component
 * would only differ by its default font size.
 */
export function LandingSection({
	id,
	title,
	description,
	children,
	className,
	align = "center",
}: LandingSectionProps) {
	return (
		<section
			id={id}
			// scroll-mt-24 clears the sticky header. The header is h-16 (64px);
			// 96px leaves a comfortable margin above the heading rather than
			// jamming it against the underside of the bar.
			className={cn(
				"scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-28",
				className,
			)}
		>
			<div className="mx-auto w-full max-w-6xl">
				{title && (
					<Reveal
						className={cn(
							"mb-12 lg:mb-16",
							align === "center" && "mx-auto max-w-2xl text-center",
						)}
					>
						<SectionTitle
							title={title}
							description={description}
							className={cn("gap-3", align === "center" && "items-center")}
							titleClassName="text-3xl sm:text-4xl font-semibold tracking-tight justify-center"
							descriptionClassName="text-base text-secondary"
						/>
					</Reveal>
				)}
				{children}
			</div>
		</section>
	);
}
