import { requireUser } from "@/lib/dal/auth";
import { mockProjects } from "../_constants/mock-projects";
import { ProjectsClient } from "./_components/projects-client";

export default async function ProjectsPage() {
	await requireUser();

	// const user = await requireUser();
	// const dbProjects = await db.select().from(projects).where(eq(projects.ownerId, user.id));

	const initialData = mockProjects;

	return <ProjectsClient initialProjects={initialData} />;
}
