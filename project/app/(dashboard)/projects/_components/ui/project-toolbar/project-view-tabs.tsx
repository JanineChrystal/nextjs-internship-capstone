import { ViewTabs } from "@/app/(dashboard)/_components/ui/toolbar";
import type { ProjectViewType } from "@/app/(dashboard)/projects/_constants/project";
import { VIEW_TABS } from "@/app/(dashboard)/projects/_constants/project";

interface ProjectViewTabsProps {
	activeView: ProjectViewType;
	onViewChange: (view: ProjectViewType) => void;
	// Members and guests hold no project settings permission, so the tab is
	// removed rather than shown and rejected on click.
	canOpenSettings?: boolean;
}

export function ProjectViewTabs({
	activeView,
	onViewChange,
	canOpenSettings = true,
}: ProjectViewTabsProps) {
	const tabs = canOpenSettings
		? VIEW_TABS
		: VIEW_TABS.filter((tab) => tab.value !== "settings");

	return (
		<ViewTabs tabs={tabs} activeView={activeView} onViewChange={onViewChange} />
	);
}
