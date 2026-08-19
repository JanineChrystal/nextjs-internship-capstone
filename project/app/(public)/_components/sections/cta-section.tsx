"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/buttons/button";
import { useLandingUiStore } from "@/stores/use-landing-ui-store";
import { CLOSING_CTA } from "../../_constants/landing";
import { Glow } from "../ui/glow";
import { Reveal } from "../ui/reveal";

/**
 * The closing call to action.
 *
 * Deliberately repeats the hero's offer rather than introducing a new one. A
 * reader who has just scrolled the whole page is at the point of deciding, and
 * making them scroll back up to find the button is the easiest conversion to
 * lose. The secondary action here is the contact drawer instead of "sign in",
 * because someone who read this far and did not sign up usually has a question
 * rather than an account.
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
