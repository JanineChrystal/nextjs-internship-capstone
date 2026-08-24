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
 * settings section component - wraps content in a BaseCard with a top scroll margin
 * to ensure titles remain visible below the fixed top bar during scrollIntoView navigation.
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
			// hover stabilization - overrides the default BaseCard hover lift since these are static, full-width forms.
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
