import type { Metadata } from "next";
import { requireUser } from "@/lib/dal/auth";
import { getAllUserProjectsDAL } from "@/lib/dal/projects";
import { toProjectUI } from "@/lib/dtos/project-dto";
import type { Project } from "@/lib/validations/project-schema";
import { ProjectsClient } from "./_components/views/projects-client";

export const metadata: Metadata = {
	title: "Projects Overview",
};

export default async function ProjectsPage() {
	const user = await requireUser();

	const dbProjects = await getAllUserProjectsDAL();
	const initialProjects: Project[] = dbProjects.map((p) =>
		toProjectUI(p, user.id),
	);

	return <ProjectsClient initialProjects={initialProjects} />;
}
