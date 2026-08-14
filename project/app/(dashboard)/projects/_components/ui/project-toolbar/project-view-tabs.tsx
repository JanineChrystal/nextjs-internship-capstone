import { ViewTabs } from "@/app/(dashboard)/_components/ui/toolbar";
import type { ProjectViewType } from "@/app/(dashboard)/projects/_constants/project";
import { VIEW_TABS } from "@/app/(dashboard)/projects/_constants/project";

interface ProjectViewTabsProps {
	activeView: ProjectViewType;
	onViewChange: (view: ProjectViewType) => void;
}

export function ProjectViewTabs({
	activeView,
	onViewChange,
}: ProjectViewTabsProps) {
	return (
		<ViewTabs
			tabs={VIEW_TABS}
			activeView={activeView}
			onViewChange={onViewChange}
		/>
	);
}
