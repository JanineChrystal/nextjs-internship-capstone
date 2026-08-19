import type { Metadata } from "next";
import { Suspense } from "react";
import { CtaSection } from "./_components/sections/cta-section";
import { FaqSection } from "./_components/sections/faq-section";
import { FeaturesSection } from "./_components/sections/features-section";
import { HeroSection } from "./_components/sections/hero-section";
import { PricingSection } from "./_components/sections/pricing-section";
import { TestimonialsSection } from "./_components/sections/testimonials-section";
import { TrustSection } from "./_components/sections/trust-section";
import { WorkflowSection } from "./_components/sections/workflow-section";
import { SessionExpiredNotice } from "./_components/session-expired-notice";

export const metadata: Metadata = {
	title: "Takda PH - Kanban project management for teams",
	description:
		"Boards, deadlines, roles and analytics in one workspace. See where the work actually stands, with a record of every change.",
};

/**
 * The landing page.
 *
 * A server component that does nothing but order eight sections. That is the
 * whole point of the split: this file is the page's outline, readable in one
 * screen, and changing the order of the argument the page makes is moving one
 * line rather than moving four hundred.
 *
 * Only three of those sections ship JavaScript - pricing and the closing CTA
 * because they open the contact drawer, and the reveal wrappers because
 * animation is a browser concern. Everything else is rendered on the server and
 * sent as HTML, which is why the first thing a visitor sees does not wait on a
 * bundle.
 */
export default function HomePage() {
	return (
		<>
			{/* Suspense is required around a component reading search params, and it
			    is what lets this page stay prerendered. */}
			<Suspense fallback={null}>
				<SessionExpiredNotice />
			</Suspense>

			<HeroSection />
			<FeaturesSection />
			<TrustSection />
			<WorkflowSection />
			<TestimonialsSection />
			<PricingSection />
			<FaqSection />
			<CtaSection />
		</>
	);
}
