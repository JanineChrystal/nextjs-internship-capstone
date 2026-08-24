"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/buttons/button";
import { useLandingUiStore } from "@/stores/use-landing-ui-store";
import { CLOSING_CTA } from "../../_constants/landing";
import { Glow } from "../ui/glow";
import { Reveal } from "../ui/reveal";

/**
 * cta section - repeats the hero's primary offer at the page bottom to
 * capture ready users, while offering a contact option instead of
 * sign-in for those with questions.
 */
export function CtaSection() {
	const openContact = useLandingUiStore((state) => state.openContact);

	return (
		<section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
			<Glow intensity="soft" />

			<Reveal className="relative mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
				<h2 className="text-balance text-3xl font-semibold tracking-tight text-on-surface sm:text-4xl">
					{CLOSING_CTA.title}
				</h2>
				<p className="text-pretty text-base text-secondary sm:text-lg">
					{CLOSING_CTA.subtitle}
				</p>

				<div className="flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
					<Button asChild size="lg" className="h-11 px-6 text-base">
						<Link href={CLOSING_CTA.primaryCta.href}>
							{CLOSING_CTA.primaryCta.label}
							<ArrowRight aria-hidden="true" />
						</Link>
					</Button>
					<Button
						type="button"
						size="lg"
						variant="outline"
						className="h-11 px-6 text-base"
						onClick={openContact}
					>
						Ask a question
					</Button>
				</div>
			</Reveal>
		</section>
	);
}
