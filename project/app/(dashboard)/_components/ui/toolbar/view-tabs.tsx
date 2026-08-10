import { Button } from "@/components/ui/buttons/button";
import { cn } from "@/lib/utils";

export interface TabOption<T extends string = string> {
	label: string;
	value: T;
}

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
		<div
			className={cn(
				"flex bg-surface-container-low p-1 rounded-lg border border-outline-variant overflow-x-auto hide-scrollbar",
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
						className={`px-4 py-1.5 font-label-md text-label-md rounded-md transition-all whitespace-nowrap h-auto ${
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
