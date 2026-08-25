import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal/auth";
import { getAllUserProjectsDAL } from "@/lib/dal/projects";
import { getAllUserTasksDAL } from "@/lib/dal/tasks";
import { toProjectUI } from "@/lib/dtos/project-dto";
import { toTaskUI } from "@/lib/dtos/task-dto";
import type { GridTask } from "@/lib/types/task";
import { CalendarPageClient } from "./calendar-page-client";

export default async function CalendarPage() {
	const user = await getCurrentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const [projects, tasks] = await Promise.all([
		getAllUserProjectsDAL(),
		getAllUserTasksDAL(),
	]);

	const projectsUI = projects.map((p) => toProjectUI(p, user.id));
	const tasksUI: GridTask[] = tasks.map((task) =>
		toTaskUI(task, task.boardTitle, [], [], []),
	);

	return (
		<CalendarPageClient initialProjects={projectsUI} initialTasks={tasksUI} />
	);
}
