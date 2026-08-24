import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/buttons/button";
import { HERO } from "../../_constants/landing";
import { LANDING_SECTIONS } from "../../_constants/nav";
import { Glow } from "../ui/glow";
import { ProductPreview } from "../ui/product-preview";
import { Reveal, RevealItem } from "../ui/reveal";

/**
 * hero section - the primary landing screen designed mobile-first,
 * ensuring proper text sizing and button stacking before scaling up for
 * larger displays.
 */
export function HeroSection() {
	return (
		<section
			id={LANDING_SECTIONS.hero}
			className="relative scroll-mt-24 overflow-hidden px-4 pt-16 pb-12 sm:px-6 sm:pt-24 lg:px-8 lg:pt-32 lg:pb-20"
		>
			<Glow intensity="medium" />

			<div className="relative mx-auto w-full max-w-5xl text-center">
				<Reveal stagger className="flex flex-col items-center gap-6">
					<RevealItem>
						<span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-container-low px-3 py-1 text-xs text-secondary sm:text-sm">
							<span className="h-1.5 w-1.5 rounded-full bg-chart-status-completed" />
							{HERO.eyebrow}
						</span>
					</RevealItem>

					<RevealItem>
						<h1 className="text-balance text-4xl font-semibold tracking-tight text-on-surface sm:text-5xl lg:text-6xl">
							{HERO.title}
						</h1>
					</RevealItem>

					<RevealItem>
						<p className="mx-auto max-w-2xl text-pretty text-base text-secondary sm:text-lg">
							{HERO.subtitle}
						</p>
					</RevealItem>

					<RevealItem className="w-full">
						{/*
  responsive buttons - stacks full-width buttons for touch targets on
  mobile, displaying side-by-side on larger screens.
*/}
						<div className="mx-auto flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
							<Button asChild size="lg" className="h-11 px-6 text-base">
								<Link href={HERO.primaryCta.href}>
									{HERO.primaryCta.label}
									<ArrowRight aria-hidden="true" />
								</Link>
							</Button>
							<Button
								asChild
								size="lg"
								variant="outline"
								className="h-11 px-6 text-base"
							>
								<Link href={HERO.secondaryCta.href}>
									{HERO.secondaryCta.label}
								</Link>
							</Button>
						</div>
					</RevealItem>
				</Reveal>
			</div>

			<Reveal
				className="relative mx-auto mt-12 w-full max-w-5xl sm:mt-16"
				delay={0.15}
			>
				<ProductPreview />
			</Reveal>

			<Reveal className="mt-10 sm:mt-12" delay={0.25}>
				<p className="text-center text-xs uppercase tracking-widest text-secondary">
					Built with
				</p>
				<ul className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
					{HERO.builtWith.map((tool) => (
						<li key={tool} className="text-sm font-medium text-secondary">
							{tool}
						</li>
					))}
				</ul>
			</Reveal>
		</section>
	);
}
