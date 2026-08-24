"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/buttons/button";
import { cn } from "@/lib/utils";
import { useLandingUiStore } from "@/stores/use-landing-ui-store";
import { PRICING_TIERS } from "../../_constants/landing";
import { LANDING_SECTIONS } from "../../_constants/nav";
import { LandingSection } from "../ui/landing-section";
import { Reveal, RevealItem } from "../ui/reveal";

/**
 * pricing section - renders interactive pricing tiers where specific CTA
 * links can trigger the contact drawer instead of navigation, avoiding
 * direct component imports.
 */
export function PricingSection() {
	const openContact = useLandingUiStore((state) => state.openContact);

	return (
		<LandingSection
			id={LANDING_SECTIONS.pricing}
			title="Simple while it is being built"
			description="The pilot is free. When that changes, everyone on it will be told before it does."
		>
			{/*
  uniform height - uses items-stretch to align cards and their bottom
  buttons regardless of feature list length.
*/}
			<Reveal
				stagger
				className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3 lg:gap-6"
			>
				{PRICING_TIERS.map((tier) => {
					const opensDrawer = tier.ctaHref === "#contact";

					return (
						<RevealItem key={tier.name} as="article" className="h-full">
							<div
								className={cn(
									"flex h-full flex-col gap-5 rounded-xl border bg-card p-6 transition-colors",
									tier.featured
										? "border-primary shadow-lg ring-1 ring-primary/30"
										: "border-border",
								)}
							>
								<div className="flex flex-col gap-1">
									<div className="flex items-center justify-between gap-2">
										<h3 className="text-base font-semibold text-on-surface">
											{tier.name}
										</h3>
										{tier.featured && (
											<span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
												Recommended
											</span>
										)}
									</div>
									<p className="text-sm text-secondary">{tier.description}</p>
								</div>

								<p className="flex items-baseline gap-1.5">
									<span className="text-3xl font-semibold text-on-surface">
										{tier.price}
									</span>
									{tier.cadence && (
										<span className="text-sm text-secondary">
											{tier.cadence}
										</span>
									)}
								</p>

								<ul className="flex flex-1 flex-col gap-2.5">
									{tier.features.map((feature) => (
										<li
											key={feature}
											className="flex items-start gap-2 text-sm text-on-surface"
										>
											<Check
												className="mt-0.5 h-4 w-4 shrink-0 text-chart-status-completed"
												aria-hidden="true"
											/>
											{feature}
										</li>
									))}
								</ul>

								{opensDrawer ? (
									<Button
										type="button"
										size="lg"
										variant="outline"
										className="h-11 w-full"
										onClick={openContact}
									>
										{tier.ctaLabel}
									</Button>
								) : (
									<Button
										asChild
										size="lg"
										variant={tier.featured ? "default" : "outline"}
										className="h-11 w-full"
									>
										<Link href={tier.ctaHref}>{tier.ctaLabel}</Link>
									</Button>
								)}
							</div>
						</RevealItem>
					);
				})}
			</Reveal>
		</LandingSection>
	);
}
