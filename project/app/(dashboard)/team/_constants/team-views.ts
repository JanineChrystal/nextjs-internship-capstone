import type { TabOption } from "@/lib/types/nav";
import type { TeamViewType } from "@/lib/types/team";

export const TEAM_VIEWS: TabOption<TeamViewType>[] = [
	{ label: "Grid", value: "Grid" },
	{ label: "Board", value: "Board" },
	// Invitations to people without an account yet. A view rather than a section
	// so the directory stays uncluttered when there are none.
	{ label: "Pending", value: "Pending" },
];
