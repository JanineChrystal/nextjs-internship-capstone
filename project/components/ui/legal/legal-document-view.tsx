import { Info } from "lucide-react";
import type { LegalDocument } from "@/lib/constants/legal";
import { LEGAL_DISCLAIMER } from "@/lib/constants/legal";

/**
 * Renders either legal document.
 *
 * One component for both, so the two pages cannot drift in typography or
 * heading level - which matters more than it sounds, because a privacy policy
 * and a set of terms that look subtly different read as though one of them was
 * pasted in from somewhere else.
 *
 * Measure is capped near 68 characters through `max-w-2xl`. These are the
 * longest continuous prose in the product, and full-width paragraphs are the
 * fastest way to make a page nobody finishes.
 */
export function LegalDocumentView({ document }: { document: LegalDocument }) {
	return (
		<article className="mx-auto w-full max-w-2xl px-margin-mobile py-16 sm:px-gutter">
			<header className="space-y-3">
				<h1 className="text-3xl font-semibold tracking-tight text-on-surface sm:text-4xl">
					{document.title}
				</h1>
				<p className="text-balance text-base text-on-surface-variant">
					{document.summary}
				</p>
				<p className="text-xs uppercase tracking-wide text-outline">
					Last updated {document.lastUpdated}
				</p>
			</header>

			<aside className="mt-8 flex gap-3 rounded-xl border border-info/40 bg-info-container p-4 text-sm text-on-info-container">
				<Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-info" />
				<p>{LEGAL_DISCLAIMER}</p>
			</aside>

			<div className="mt-10 space-y-10">
				{document.sections.map((section) => (
					<section key={section.heading} className="space-y-3">
						<h2 className="text-lg font-semibold text-on-surface">
							{section.heading}
						</h2>

						{section.body.map((paragraph) => (
							<p
								key={paragraph}
								className="text-sm leading-relaxed text-on-surface-variant"
							>
								{paragraph}
							</p>
						))}

						{section.points && (
							<ul className="space-y-2 pl-5">
								{section.points.map((point) => (
									<li
										key={point}
										className="list-disc text-sm leading-relaxed text-on-surface-variant marker:text-outline"
									>
										{point}
									</li>
								))}
							</ul>
						)}
					</section>
				))}
			</div>
		</article>
	);
}
