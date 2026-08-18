import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { BaseCard } from "@/components/ui/cards/base-card";
import { QUICK_ACTIONS } from "../_constants/quick-actions";

export function QuickActionsPanel() {
	return (
		<BaseCard className="hover:scale-100 gap-4">
			<h2 className="text-base font-semibold text-on-surface">Quick Actions</h2>

			<ul className="flex flex-col gap-1">
				{QUICK_ACTIONS.map((action) => (
					<li key={action.href}>
						<Link
							href={action.href}
							className="flex items-center gap-3 rounded-lg p-3 hover:bg-surface-container transition-colors"
						>
							{action.icon && (
								<action.icon
									className="h-4 w-4 text-primary shrink-0"
									aria-hidden="true"
								/>
							)}
							<span className="text-sm text-on-surface flex-1">
								{action.name}
							</span>
							<ChevronRight
								className="h-4 w-4 text-secondary shrink-0"
								aria-hidden="true"
							/>
						</Link>
					</li>
				))}
			</ul>
		</BaseCard>
	);
}
