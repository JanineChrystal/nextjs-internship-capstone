export const mockTargetUser = {
	name: "Alex Johnson",
	email: "alex@example.com",
	role: "Frontend Developer",
	avatarUrl: "/avatars/alex.jpg",
};

export const mockVisibleProjects = [
	{
		id: "prj_1",
		title: "PUP SCRAMPS System",
		jobRole: "UI Designer",
		roleAccess: "member" as const,
		totalTasks: 8,
		completedTasks: 6,
		tasks: [
			{ id: "t1", name: "Design Member Modal", status: "Completed" as const },
			{
				id: "t2",
				name: "Update Primary Color Palette",
				status: "In Progress" as const,
			},
		],
	},
];
