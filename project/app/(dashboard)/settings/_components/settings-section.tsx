import type React from "react";
import { BaseCard } from "@/components/ui/cards/base-card";
import type { SettingsSectionDomId } from "@/lib/types/settings";
import { cn } from "@/lib/utils";

interface SettingsSectionProps {
	/** Doubles as the scroll target and as the id the scroll-spy observes. */
	id: SettingsSectionDomId;
	title: string;
	description: string;
	children: React.ReactNode;
	className?: string;
}

/**
 * One card on the settings one-pager.
 *
 * The `scroll-mt-24` is not cosmetic: the dashboard's top bar is fixed, so
 * without it `scrollIntoView` puts the heading exactly underneath the bar and
 * the reader lands on a section whose title they cannot see.
 */
export function SettingsSection({
	id,
	title,
	description,
	children,
	className,
}: SettingsSectionProps) {
	return (
		<BaseCard
			id={id}
			// BaseCard lifts on hover, which suits a clickable card in a grid and
			// not a full-width panel the reader is filling in.
			className={cn("hover:scale-100 scroll-mt-24 gap-5", className)}
		>
			<div>
				<h2 className="text-xl font-semibold text-on-surface">{title}</h2>
				<p className="text-sm text-secondary mt-1">{description}</p>
			</div>

			{children}
		</BaseCard>
	);
}
