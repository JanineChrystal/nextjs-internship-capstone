"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";
import { WarningModal } from "@/app/(dashboard)/_components/ui/modals/warning-modal";
import { BulkActionBar } from "@/app/(dashboard)/_components/ui/toolbar/bulk-action-bar";
import { TASK_PRIORITY_OPTIONS } from "@/app/(dashboard)/_constants/task";
import { ActionConfirmModal } from "@/components/modals/action-confirm-modal";
import { applyArchiveOperationAction } from "@/lib/actions/archive-actions";
import { reportActionError, reportActionSuccess } from "@/lib/utils/toast";
import type { Project } from "@/lib/validations/project-schema";
import { useProjectsClient } from "../../_hooks/use-projects-client";
import { ProjectCard } from "../ui/cards/project-card";
import { ProjectsListToolbar } from "../ui/projects-list-toolbar";

const ProjectModal = dynamic(
	() =>
		import("../../../_components/ui/modals/project-modal").then(
			(m) => m.ProjectModal,
		),
	{ ssr: false },
);

// 1. Define the props interface to satisfy TypeScript
// Replace `any` with your actual Project type (e.g., `Project[]`) if you have it exported
export interface ProjectsClientProps {
	initialProjects: Project[];
}

// 2. Accept the prop in the component signature
export function ProjectsClient({ initialProjects }: ProjectsClientProps) {
	// 3. (Optional but recommended) Pass the initial data into your custom hook
	// so it can use the server-fetched data as its starting state.
	const { modals, selection, filters } = useProjectsClient(initialProjects);
	const router = useRouter();

	/**
	 * Archives a project from its card.
	 *
	 * No optimistic removal here, unlike the task board: the projects list is
	 * server-rendered from getAllUserProjectsDAL, so refreshing is what makes the
	 * card disappear - and it also refreshes the counts and stats that the same
	 * server render produced, which a local filter would have left stale.
	 */
	const handleArchiveProject = async (projectId: string) => {
		const result = await applyArchiveOperationAction(
			"project",
			projectId,
			"archive",
		);

		if (!result.success) {
			reportActionError("Could not archive project", result.error);
			return;
		}

		reportActionSuccess("Project archived");
		router.refresh();
	};

	const isSingleDelete = selection.projectToDelete !== null;
	const deleteCount = isSingleDelete ? 1 : selection.selectedProjectIds.size;

	const categories = useMemo(() => {
		const uniqueCategories = new Set(
			initialProjects.map((p) => p.category?.trim() || "Uncategorized"),
		);
		return Array.from(uniqueCategories).map((c) => ({
			label: c,
			value: c.toLowerCase(),
		}));
	}, [initialProjects]);

	const filterFields = [
		{
			id: "status",
			label: "Status",
			options: [
				{ label: "Active", value: "active" },
				{ label: "Completed", value: "completed" },
				{ label: "Overdue", value: "overdue" },
				{ label: "Archived", value: "archived" },
			],
		},
		{
			id: "priority",
			label: "Priority",
			options: TASK_PRIORITY_OPTIONS,
		},
		{
			id: "category",
			label: "Category",
			options: categories,
		},
		{
			id: "isOwned",
			label: "Ownership",
			options: [{ label: "Owned by Me", value: "true" }],
		},
	];

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Projects"
				description="Manage and organize your team projects"
				className="bg-surface border border-outline-variant rounded-xl p-6"
			/>
			<ProjectsListToolbar
				onCreateProject={() => modals.create.setIsOpen(true)}
				filters={{
					fields: filterFields,
					values: filters.filterValues,
					onChange: filters.handleFilterChange,
					onReset: filters.handleResetFilters,
				}}
			/>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{filters.filteredProjects.length > 0 ? (
					filters.filteredProjects.map((project) => (
						<div key={project.id} className="relative">
							<ProjectCard
								project={project}
								isSelected={selection.selectedProjectIds.has(project.id)}
								onToggleSelection={() => selection.toggleSelection(project.id)}
								onDelete={selection.initiateSingleDelete}
								onArchive={handleArchiveProject}
							/>
						</div>
					))
				) : (
					<div className="col-span-full py-12 text-center text-muted-foreground">
						No projects found matching the selected filters.
					</div>
				)}
			</div>

			{/* Render Modals */}
			<ProjectModal
				isOpen={modals.create.isOpen}
				onClose={() => modals.create.setIsOpen(false)}
			/>

			<ActionConfirmModal
				isOpen={modals.delete.isOpen}
				onClose={modals.delete.close}
				onConfirm={selection.confirmDelete}
				title={isSingleDelete ? "Delete Project" : "Delete Projects"}
				description={`Are you sure you want to delete ${deleteCount} selected project(s)? This action cannot be undone.`}
				confirmText={isSingleDelete ? "Delete Project" : "Delete Projects"}
				isDestructive={true}
			/>

			<WarningModal
				isOpen={modals.warning.isOpen}
				onClose={modals.warning.close}
				onConfirm={modals.warning.confirm}
				title={
					modals.warning.actionType === "delete"
						? "Delete Project"
						: modals.warning.actionType === "archive"
							? "Archive Project"
							: "Mark as Completed"
				}
				message={
					modals.warning.actionType === "delete"
						? "This project has ongoing tasks. Are you sure you want to delete it? This action cannot be undone."
						: modals.warning.actionType === "archive"
							? "There are still ongoing tasks in this project. Are you sure you want to archive it?"
							: "There are still ongoing tasks in this project. Are you sure you want to set it as completed?"
				}
				variant={modals.warning.actionType === "delete" ? "danger" : "warning"}
				confirmText={
					modals.warning.actionType === "delete"
						? "Delete Anyway"
						: modals.warning.actionType === "archive"
							? "Archive Anyway"
							: "Complete Anyway"
				}
			/>

			<BulkActionBar
				selectedCount={selection.selectedProjectIds.size}
				onClearSelection={selection.clearSelection}
				onDelete={selection.initiateBulkDelete}
				onArchive={selection.initiateBulkArchive}
				onComplete={selection.initiateBulkComplete}
			/>
		</div>
	);
}
