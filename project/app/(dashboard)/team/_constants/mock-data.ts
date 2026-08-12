import type { WorkspaceUser } from "@/types/member";

export const mockWorkspaceUsers: WorkspaceUser[] = [
	{
		id: "u1",
		name: "Janine Chrystal",
		email: "janine@example.com",
		roles: ["Project Manager", "Developer"],
		projectIds: ["p1", "p2", "p3"],
		projectCount: 3,
		status: "active",
	},
	{
		id: "u2",
		name: "Alex Johnson",
		email: "alex@example.com",
		roles: ["Developer"],
		projectIds: ["p1"],
		projectCount: 1,
		status: "active",
	},
	{
		id: "u3",
		name: "Sam Smith",
		email: "sam@example.com",
		roles: ["Designer", "Project Manager"],
		projectIds: ["p2", "p4"],
		projectCount: 2,
		status: "active",
	},
];
