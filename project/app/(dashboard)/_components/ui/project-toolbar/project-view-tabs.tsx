import { VIEW_TABS } from "@/app/(dashboard)/projects/_constants/project";
import type { ProjectViewType } from "@/app/(dashboard)/projects/[id]/page";
import { Button } from "@/components/ui/buttons/button";

interface ProjectViewTabsProps {
	activeView: ProjectViewType;
	onViewChange: (view: ProjectViewType) => void;
}

export function ProjectViewTabs({
	activeView,
	onViewChange,
}: ProjectViewTabsProps) {
	return (
		<div className="flex bg-surface-container-low p-1 rounded-lg border border-outline-variant overflow-x-auto hide-scrollbar">
			{VIEW_TABS.map((tab) => {
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
