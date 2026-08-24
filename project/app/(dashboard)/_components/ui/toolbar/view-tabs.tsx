import { Button } from "@/components/ui/buttons/button";
import type { TabOption } from "@/lib/types/nav";
import { cn } from "@/lib/utils";

interface ViewTabsProps<T extends string = string> {
	tabs: readonly TabOption<T>[];
	activeView: T;
	onViewChange: (view: T) => void;
	className?: string;
}

export function ViewTabs<T extends string = string>({
	tabs,
	activeView,
	onViewChange,
	className,
}: ViewTabsProps<T>) {
	return (
		/*
		 * Sized to fit rather than sized to scroll. The strip already scrolled
		 * horizontally, but `hide-scrollbar` removed the only hint that it did, so
		 * on a 375px screen the last tab was simply cut in half and looked broken.
		 * Tighter padding and a smaller label fit all five across a phone; the
		 * overflow stays as a fallback for a longer set.
		 */
		<div
			className={cn(
				"flex w-full bg-surface-container-low p-1 rounded-lg border border-outline-variant overflow-x-auto hide-scrollbar md:w-auto",
				className,
			)}
		>
			{tabs.map((tab) => {
				const isActive = activeView === tab.value;

				return (
					<Button
						key={tab.value}
						type="button"
						onClick={() => onViewChange(tab.value)}
						variant="ghost"
						className={`flex-1 px-2 py-1.5 text-label-sm rounded-md transition-all whitespace-nowrap h-auto sm:flex-none sm:px-4 sm:text-label-md ${
							isActive
								? "bg-surface text-on-surface shadow-sm border border-outline-variant/50 font-semibold hover:bg-surface"
								: "text-secondary hover:text-on-surface hover:bg-surface-variant/50 border border-transparent shadow-none"
						}`}
					>
						{tab.label}
					</Button>
				);
			})}
		</div>
	);
}
