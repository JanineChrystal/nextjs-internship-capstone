import { Quote } from "lucide-react";
import { BaseCard } from "@/components/ui/cards/base-card";
import { TESTIMONIALS } from "../../_constants/landing";
import { LandingSection } from "../ui/landing-section";
import { Reveal, RevealItem } from "../ui/reveal";

/**
 * testimonials section - displays pilot feedback attributed honestly to
 * roles and initials instead of using fabricated stock portraits and
 * names.
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
							{/*
  valid markup - uses a standard div rather than a figcaption because it
  exists outside a figure element.
*/}
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
