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
 * landing section wrapper - standardizes anchor IDs, vertical rhythm,
 * and scroll margin across all landing sections while reusing the app's
 * SectionTitle component.
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
			// anchor margin - adds scroll-margin-top to prevent the sticky header from covering the section heading when jumping to anchor links.
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
