import type { Project } from "@/lib/validations/project-schema";

export const mockProjects: Project[] = [
	{
		id: "1",
		title: "Website Redesign",
		description:
			"Revamp the landing page to use the new floating card UI shell.",
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
		id: "2",
		title: "Database Migration",
		description: "Move schemas to Drizzle ORM and Neon Postgres.",
		membersCount: 4,
		tasksCount: 12,
		progress: 30,
		daysLeft: 17,
		// New fields
		status: "active",
		priority: "low",
		isOwned: false,
		isAssigned: true,
	},
	{
		id: "3",
		title: "Auth Integration",
		description: "Finalize Clerk webhooks and user synchronization logic.",
		membersCount: 2,
		tasksCount: 8,
		progress: 100,
		daysLeft: 5,
		// New fields
		status: "completed",
		priority: "high",
		isOwned: false,
		isAssigned: false,
	},
];
