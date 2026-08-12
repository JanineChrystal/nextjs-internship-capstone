import type { TabOption } from "@/app/(dashboard)/_components/ui/toolbar";
import type { TeamViewType } from "../_components/team-toolbar";

export const TEAM_VIEWS: TabOption<TeamViewType>[] = [
	{ label: "Grid", value: "Grid" },
	{ label: "Board", value: "Board" },
];
