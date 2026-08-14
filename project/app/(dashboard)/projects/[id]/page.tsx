import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal/auth";
import { getProjectBoardsDAL } from "@/lib/dal/boards";
import { getProjectById } from "@/lib/dal/projects";
import { getTasksByProjectId } from "@/lib/dal/tasks";
import { toProjectUI } from "@/lib/dtos/project-dto";
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

	const projectUI = toProjectUI(project, user.id);

	return (
		<ProjectDetailClient
			projectId={resolvedParams.id}
			project={project}
			projectUI={projectUI}
			tasks={tasks}
			boards={boards}
		/>
	);
}
