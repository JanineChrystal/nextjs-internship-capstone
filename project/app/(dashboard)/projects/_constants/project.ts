import type { TabOption } from "@/lib/types/nav";
import type { ProjectViewType } from "@/lib/types/project";

export const MAX_VISIBLE_MEMBERS = 5;

export const VIEW_TABS: TabOption<ProjectViewType>[] = [
	{ label: "Grid", value: "grid" },
	{ label: "Board", value: "board" },
	{ label: "Calendar", value: "calendar" },
	{ label: "Charts", value: "charts" },
	{ label: "Settings", value: "settings" },
];

export const FILTERABLE_VIEWS: ProjectViewType[] = [
	"grid",
	"board",
	"calendar",
];
