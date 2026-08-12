import type { RoleAccess } from "./member";

export interface ProfileTask {
	id: string;
	name: string;
	status: "Completed" | "In Progress" | "To Do";
}

export interface ProfileProjectData {
	id: string;
	title: string;
	jobRole: string;
	roleAccess: RoleAccess;
	totalTasks: number;
	completedTasks: number;
	tasks: ProfileTask[];
}
