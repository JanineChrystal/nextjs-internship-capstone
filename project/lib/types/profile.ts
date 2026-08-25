import type { RoleAccess } from "./member";

/** profile subject - the person whose page is being viewed, trimmed to what the header renders. */
export interface ProfileUser {
	id: string;
	name: string;
	email: string;
	avatarUrl: string;
}

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
