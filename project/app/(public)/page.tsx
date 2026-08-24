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
 * landing page - acts as a server-rendered outline component that simply
 * orders the sections, minimizing the client-side JavaScript bundle and
 * improving initial load times.
 */
export default function HomePage() {
	return (
		<>
			{/*
			  suspense boundary - required for components reading search params,
			  ensuring the parent page remains prerendered instead of dynamic.
			*/}
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
