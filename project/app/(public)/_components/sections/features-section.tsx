import { BaseCard } from "@/components/ui/cards/base-card";
import { cn } from "@/lib/utils";
import { BENTO_FEATURES, CAPABILITIES } from "../../_constants/landing";
import { LANDING_SECTIONS } from "../../_constants/nav";
import { LandingSection } from "../ui/landing-section";
import { Reveal, RevealItem } from "../ui/reveal";

/**
 * The features section: four large panels, then a dense grid of one-liners.
 *
 * Two densities on purpose. The bento panels are for the reader deciding whether
 * this product is for them at all, and each gets room to make an argument. The
 * grid below is for the reader who has already decided and is now checking their
 * checklist - that reader wants breadth and scannability, not prose.
 *
 * The cards are the app's own `BaseCard`, not a landing-page card. It already
 * carries the border, radius, padding and hover treatment the rest of the
 * product uses, so the marketing page and the app look like the same piece of
 * software - which is the whole reason a landing page is worth building.
 */
export function FeaturesSection() {
	return (
		<LandingSection
			id={LANDING_SECTIONS.features}
			title="Everything a project needs, nothing it does not"
			description="The parts that make a board worth keeping open: columns that match the work, access that holds up, and a record of what actually happened."
		>
			{/* Bento: one column on a phone, two from md up. The `wide` panels take
			    both columns there, which is what makes the grid read as a bento
			    rather than a plain 2x2. */}
			<Reveal
				stagger
				className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6"
			>
				{BENTO_FEATURES.map((feature) => (
					<RevealItem
						key={feature.title}
						as="article"
						className={cn(feature.wide && "md:col-span-2")}
					>
						<BaseCard className="gap-3 hover:scale-100 hover:border-primary/40">
							<span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
								<feature.icon
									className="h-5 w-5 text-primary"
									aria-hidden="true"
								/>
							</span>
							<h3 className="text-lg font-semibold text-on-surface">
								{feature.title}
							</h3>
							<p className="text-sm leading-relaxed text-secondary">
								{feature.description}
							</p>
						</BaseCard>
					</RevealItem>
				))}
			</Reveal>

			{/* The dense grid. Steps 1 -> 2 -> 4 columns so a phone gets a readable
			    single column, a tablet two, and a desktop four. */}
			<Reveal
				stagger
				as="ul"
				className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:mt-10 lg:grid-cols-4"
			>
				{CAPABILITIES.map((capability) => (
					<RevealItem
						key={capability.title}
						as="li"
						className="flex flex-col gap-1.5"
					>
						<span className="flex items-center gap-2 text-sm font-medium text-on-surface">
							<capability.icon
								className="h-4 w-4 shrink-0 text-primary"
								aria-hidden="true"
							/>
							{capability.title}
						</span>
						<span className="text-sm leading-snug text-secondary">
							{capability.description}
						</span>
					</RevealItem>
				))}
			</Reveal>
		</LandingSection>
	);
}
