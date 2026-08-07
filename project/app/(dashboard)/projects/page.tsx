import type { Metadata } from "next";
import { requireUser } from "@/lib/dal/auth";
import { ProjectsClient } from "./_components/views/projects-client";
import { mockProjects } from "./_constants/project";

export const metadata: Metadata = {
	title: "Projects Overview",
};

export default async function ProjectsPage() {
	await requireUser();

	// const user = await requireUser();
	// const dbProjects = await db.select().from(projects).where(eq(projects.ownerId, user.id));

	const initialData = mockProjects;

	return <ProjectsClient initialProjects={initialData} />;
}
