import type { Project } from "@/lib/validations/project-schema";

export const MOCK_PROJECTS: Project[] = [
	{
		id: "1",
		title: "Website Redesign",
		description:
			"Revamp the landing page to use the new floating card UI shell.",
		daysLeft: 10,
		membersCount: 6,
		tasksCount: 17,
		progress: 65,
		status: "active",
	},
	{
		id: "2",
		title: "Database Migration",
		description: "Move schemas to Drizzle ORM and Neon Postgres.",
		daysLeft: 17,
		membersCount: 4,
		tasksCount: 12,
		progress: 80,
		status: "active",
	},
	{
		id: "3",
		title: "Auth Integration",
		description: "Finalize Clerk webhooks and user synchronization logic.",
		daysLeft: 5,
		membersCount: 2,
		tasksCount: 8,
		progress: 40,
		status: "active",
	},
];
