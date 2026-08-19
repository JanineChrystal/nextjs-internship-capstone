import { TRUST_POINTS, TRUST_SECTION } from "../../_constants/landing";
import { HorizonArc } from "../ui/glow";
import { Reveal, RevealItem } from "../ui/reveal";

/**
 * The quiet section between the features and the workflow rail.
 *
 * Every page needs somewhere for the eye to rest, and this is it: a short claim,
 * two supporting lines, and the horizon arc. It is also where the page says the
 * one thing a project-management tool actually has to be believed about, which
 * is that access control is real.
 *
 * `min-h-[32rem]` rather than a fixed height so the arc has room to sit under
 * the text without the section collapsing around it when the copy is short on a
 * wide screen - and without clipping the copy when it wraps to six lines on a
 * narrow one.
 */
export function TrustSection() {
	return (
		<section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
			<div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
				<Reveal>
					<h2 className="text-balance text-3xl font-semibold tracking-tight text-on-surface sm:text-4xl">
						{TRUST_SECTION.title}
					</h2>
				</Reveal>

				<Reveal delay={0.1}>
					<p className="text-pretty text-base text-secondary sm:text-lg">
						{TRUST_SECTION.subtitle}
					</p>
				</Reveal>

				<Reveal
					stagger
					as="ul"
					className="mt-4 grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-2"
				>
					{TRUST_POINTS.map((point) => (
						<RevealItem
							key={point.title}
							as="li"
							className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface-container-low/60 p-4 backdrop-blur-sm"
						>
							<span className="flex items-center gap-2 text-sm font-medium text-on-surface">
								<point.icon
									className="h-4 w-4 shrink-0 text-primary"
									aria-hidden="true"
								/>
								{point.title}
							</span>
							<span className="text-sm leading-snug text-secondary">
								{point.description}
							</span>
						</RevealItem>
					))}
				</Reveal>
			</div>

			<HorizonArc className="h-64 sm:h-80" />
		</section>
	);
}
