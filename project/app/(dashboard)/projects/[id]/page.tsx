import { notFound, redirect } from "next/navigation";
import { getAttachmentsByTaskIds } from "@/lib/dal/attachments";
import { getCurrentUser } from "@/lib/dal/auth";
import { getProjectBoardsDAL } from "@/lib/dal/boards";
import { getChecklistItemsByTaskIds } from "@/lib/dal/checklists";
import { getProjectById } from "@/lib/dal/projects";
import { getTaskAssigneesByTaskIds } from "@/lib/dal/task-assignees";
import { getTasksByProjectId } from "@/lib/dal/tasks";
import { toProjectUI } from "@/lib/dtos/project-dto";
import { toTaskUI } from "@/lib/dtos/task-dto";
import type { GridTask } from "@/lib/types/task";
import { ProjectDetailClient } from "./project-detail-client";

export default async function ProjectPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const resolvedParams = await params;
	const user = await getCurrentUser();

	if (!user) {
		redirect("/sign-in");
	}

	const [project, tasks, boards] = await Promise.all([
		getProjectById(resolvedParams.id),
		getTasksByProjectId(resolvedParams.id),
		getProjectBoardsDAL(resolvedParams.id),
	]);

	if (!project) {
		notFound();
	}

	// Derived from the tasks already fetched above rather than a second
	// aggregate query, so the detail page's counts match the projects list.
	const projectUI = toProjectUI(project, user.id, {
		taskCount: tasks.length,
		completedTaskCount: tasks.filter((t) => t.isCompleted).length,
		memberCount: 0,
	});

	const taskIds = tasks.map((task) => task.id);
	const [assigneesByTask, checklistByTask, attachmentsByTask] =
		await Promise.all([
			getTaskAssigneesByTaskIds(taskIds),
			getChecklistItemsByTaskIds(taskIds),
			getAttachmentsByTaskIds(taskIds),
		]);
	const boardTitleById = new Map(boards.map((board) => [board.id, board.name]));

	const tasksUI: GridTask[] = tasks.map((task) =>
		toTaskUI(
			task,
			boardTitleById.get(task.boardId) ?? "",
			assigneesByTask.get(task.id) ?? [],
			checklistByTask.get(task.id) ?? [],
			attachmentsByTask.get(task.id) ?? [],
		),
	);

	return (
		<ProjectDetailClient
			projectId={resolvedParams.id}
			project={project}
			projectUI={projectUI}
			tasks={tasksUI}
			boards={boards}
		/>
	);
}
