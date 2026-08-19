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
 * Questions and answers, as a single-open accordion.
 *
 * `type="single" collapsible` rather than `multiple`: an FAQ is read one
 * question at a time, and allowing several open at once means the answer someone
 * is reading can be pushed off the screen by an earlier one they forgot to
 * close. `collapsible` lets the open one be closed again, which `single` alone
 * does not.
 *
 * Radix renders each trigger as a real `<button>` inside a heading, so keyboard
 * and screen-reader users get the expand/collapse behaviour and the
 * `aria-expanded` state without any of that being written here. That is the
 * argument for using the primitive rather than a hand-rolled `useState` toggle,
 * which is easy to write and almost always ships without the ARIA.
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
