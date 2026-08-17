import type { TabOption } from "@/app/(dashboard)/_components/ui/toolbar";
import type { TeamViewType } from "../_components/team-toolbar";

export const TEAM_VIEWS: TabOption<TeamViewType>[] = [
	{ label: "Grid", value: "Grid" },
	{ label: "Board", value: "Board" },
	// Invitations to people without an account yet. A view rather than a section
	// so the directory stays uncluttered when there are none.
	{ label: "Pending", value: "Pending" },
];
