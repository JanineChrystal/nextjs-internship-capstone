import { Sigma } from "lucide-react";
import { BaseCard } from "@/components/ui/cards/base-card";
import { ANALYTICS_FORMULAS } from "../_constants/formulas";

/**
 * formula notes - renders collapsable metric definitions directly on the
 * page to keep them closely tied to the code that generates them.
 */
export function FormulaNotes() {
	return (
		<BaseCard className="hover:scale-100 gap-3">
			<details>
				<summary className="cursor-pointer flex items-center gap-2 text-base font-semibold text-on-surface">
					<Sigma className="h-4 w-4 text-primary" aria-hidden="true" />
					How these numbers are calculated
				</summary>

				<dl className="mt-4 flex flex-col gap-4">
					{ANALYTICS_FORMULAS.map((note) => (
						<div
							key={note.metric}
							className="border-l-2 border-border pl-4 flex flex-col gap-1"
						>
							<dt className="text-sm font-medium text-on-surface">
								{note.metric}
							</dt>
							<dd className="text-sm text-primary font-mono wrap-anywhere">
								{note.formula}
							</dd>
							<dd className="text-sm text-secondary">{note.reasoning}</dd>
						</div>
					))}
				</dl>
			</details>
		</BaseCard>
	);
}
