import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQS } from "../../_constants/landing";
import { LANDING_SECTIONS } from "../../_constants/nav";
import { LandingSection } from "../ui/landing-section";
import { Reveal } from "../ui/reveal";

/**
 * faq section - renders questions in a collapsible single-open accordion
 * using Radix UI for native keyboard and screen reader support without
 * custom state management.
 */
export function FaqSection() {
	return (
		<LandingSection
			id={LANDING_SECTIONS.faq}
			title="Questions and answers"
			description="If yours is not here, the contact button in the corner reaches us directly."
		>
			<Reveal className="mx-auto w-full max-w-3xl">
				<Accordion type="single" collapsible className="w-full">
					{FAQS.map((faq) => (
						<AccordionItem key={faq.question} value={faq.question}>
							<AccordionTrigger className="text-left text-base font-medium text-on-surface">
								{faq.question}
							</AccordionTrigger>
							<AccordionContent className="text-sm leading-relaxed text-secondary">
								{faq.answer}
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</Reveal>
		</LandingSection>
	);
}
