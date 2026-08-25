import { WORKFLOW_STEPS } from "../../_constants/landing";
import { LANDING_SECTIONS } from "../../_constants/nav";
import { LandingSection } from "../ui/landing-section";
import { ProductPreview } from "../ui/product-preview";
import { Reveal, RevealItem } from "../ui/reveal";

/**
 * workflow section - displays a numbered steps rail beside a sticky
 * product illustration on desktop, stacking the steps above the image on
 * mobile for better flow.
 */
export function WorkflowSection() {
	return (
		<LandingSection
			id={LANDING_SECTIONS.workflow}
			title="From an empty board to a report, in four moves"
			description="Nothing here is a separate thing to maintain. The history and the analytics are made out of the work itself."
		>
			<div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start lg:gap-14">
				<Reveal stagger as="ul" className="flex flex-col gap-8">
					{WORKFLOW_STEPS.map((step, index) => (
						<RevealItem key={step.title} as="li" className="flex gap-4">
							{/*
  decorative numbering - uses aria-hidden on step numbers to avoid
  redundant screen reader announcements in the ordered list.
*/}
							<span
								aria-hidden="true"
								className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-sm font-semibold text-primary"
							>
								{index + 1}
							</span>
							<div className="flex flex-col gap-1.5 pt-1">
								<h3 className="text-base font-semibold text-on-surface sm:text-lg">
									{step.title}
								</h3>
								<p className="text-sm leading-relaxed text-secondary">
									{step.description}
								</p>
							</div>
						</RevealItem>
					))}
				</Reveal>

				<Reveal className="lg:sticky lg:top-24" delay={0.1}>
					<ProductPreview />
				</Reveal>
			</div>
		</LandingSection>
	);
}
