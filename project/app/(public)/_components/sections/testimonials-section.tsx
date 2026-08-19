import { Quote } from "lucide-react";
import { BaseCard } from "@/components/ui/cards/base-card";
import { TESTIMONIALS } from "../../_constants/landing";
import { LandingSection } from "../ui/landing-section";
import { Reveal, RevealItem } from "../ui/reveal";

/**
 * What people say, attributed to roles rather than invented people.
 *
 * The deliberate choice here is what is *missing*: no photographs, no company
 * logos, no full names. A capstone that renders three stock portraits under
 * fabricated names is making a claim it cannot support, and a reviewer who
 * notices stops believing the rest of the page too. Initials in a circle and a
 * role is honest about exactly what these are - feedback from a pilot - while
 * still doing the job a testimonial does.
 */
export function TestimonialsSection() {
	return (
		<LandingSection
			id="testimonials"
			title="What the first workspaces noticed"
			description="Feedback from the pilot, attributed by role."
		>
			<Reveal
				stagger
				className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6"
			>
				{TESTIMONIALS.map((testimonial) => (
					<RevealItem key={testimonial.name} as="article" className="h-full">
						<BaseCard className="gap-4 hover:scale-100">
							<Quote className="h-5 w-5 text-primary/60" aria-hidden="true" />
							<blockquote className="flex-1 text-sm leading-relaxed text-on-surface">
								{testimonial.quote}
							</blockquote>
							{/* A plain div, not a figcaption: BaseCard renders a div, and a
							    figcaption outside a figure is invalid markup that browsers
							    silently accept and validators do not. */}
							<div className="flex items-center gap-3 border-t border-border pt-4">
								<span
									aria-hidden="true"
									className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
								>
									{testimonial.initials}
								</span>
								<span className="flex min-w-0 flex-col">
									<span className="truncate text-sm font-medium text-on-surface">
										{testimonial.name}
									</span>
									<span className="truncate text-xs text-secondary">
										{testimonial.role}
									</span>
								</span>
							</div>
						</BaseCard>
					</RevealItem>
				))}
			</Reveal>
		</LandingSection>
	);
}
