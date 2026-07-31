import { Plus } from "lucide-react";
import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";
import { Button } from "@/components/ui/buttons/button";
import { ProjectCard } from "../_components/ui/cards/project-card";
import { MOCK_PROJECTS } from "../_constants/mock-projects";

export default function ProjectsPage() {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Projects"
				description="Manage and organize your team projects"
				filters={
					<>
						<Button variant="outline" size="sm" className="rounded-full">
							Owned Projects
						</Button>
						<Button variant="ghost" size="sm" className="rounded-full">
							Assigned to Me
						</Button>
						{/* Spacer to push Tag Filter to the right */}
						<Button variant="outline" size="sm" className="rounded-full">
							Tag Filter
						</Button>
						<div className="flex-1" />{" "}
					</>
				}
				action={
					<Button className="w-full sm:w-auto bg-background text-foreground border-slate-200">
						<Plus className="w-4 h-4 mr-2" />
						Create New Project
					</Button>
				}
			/>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{MOCK_PROJECTS.map((project) => (
					<ProjectCard key={project.id} project={project} />
				))}
			</div>
		</div>
	);
}
