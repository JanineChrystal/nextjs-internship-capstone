import type { Metadata } from "next";
import { requireUser } from "@/lib/dal/auth";
import { getAllUserProjectsDAL, getProjectStatsDAL } from "@/lib/dal/projects";
import { toProjectUI } from "@/lib/dtos/project-dto";
import type { Project } from "@/lib/validations/project-schema";
import { ProjectsClient } from "./_components/views/projects-client";

export const metadata: Metadata = {
	title: "Projects Overview",
};

export default async function ProjectsPage() {
	const user = await requireUser();

	// Fetched together so the stats query does not serialise behind the
	// projects query on every page load.
	const [dbProjects, stats] = await Promise.all([
		getAllUserProjectsDAL(),
		getProjectStatsDAL(),
	]);

	const initialProjects: Project[] = dbProjects.map((p) =>
		toProjectUI(p, user.id, stats.get(p.id)),
	);

	return <ProjectsClient initialProjects={initialProjects} />;
}
