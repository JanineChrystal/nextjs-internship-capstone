import type { Project } from "@/lib/validations/project-schema";
import type { ProjectViewType } from "../[id]/page";

export const mockProjects: Project[] = [
	{
		id: "11111111-1111-1111-1111-111111111111",
		title: "Website Redesign",
		description:
			"Revamp the landing page to use the new floating card UI shell.",
		category: "Design",
		startDate: "2024-03-01",
		dueDate: "2024-03-15",
		membersCount: 6,
		tasksCount: 17,
		progress: 65,
		daysLeft: 10,
		status: "active",
		priority: "high",
		isOwned: true,
		isAssigned: false,
	},
	{
		id: "22222222-2222-2222-2222-222222222222",
		title: "Database Migration",
		description: "Move schemas to Drizzle ORM and Neon Postgres.",
		category: "Backend",
		startDate: "2024-02-15",
		dueDate: "2024-04-01",
		membersCount: 4,
		tasksCount: 12,
		progress: 30,
		daysLeft: 17,
		status: "active",
		priority: "low",
		isOwned: false,
		isAssigned: true,
	},
	{
		id: "33333333-3333-3333-3333-333333333333",
		title: "Auth Integration",
		description: "Finalize Clerk webhooks and user synchronization logic.",
		category: "Security",
		startDate: "2024-01-10",
		dueDate: "2024-01-30",
		membersCount: 2,
		tasksCount: 8,
		progress: 100,
		daysLeft: 5,
		status: "completed",
		priority: "high",
		isOwned: false,
		isAssigned: false,
	},
];

export const VIEW_TABS: { label: string; value: ProjectViewType }[] = [
	{ label: "Grid", value: "grid" },
	{ label: "Board", value: "board" },
	{ label: "Calendar", value: "calendar" },
	{ label: "Charts", value: "charts" },
	{ label: "Settings", value: "settings" },
];

export const PROJECT_MEMBERS: {
	name: string;
	email: string;
	avatarUrl: string;
}[] = [
	{
		name: "Sarah",
		email: "sarah@example.com",
		avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
	},
	{
		name: "Mike",
		email: "mike@example.com",
		avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
	},
	{
		name: "Alex",
		email: "alex@example.com",
		avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
	},
	{
		name: "John",
		email: "john@example.com",
		avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
	},
	{
		name: "Emily",
		email: "emily@example.com",
		avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
	},
];
