"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";
import { WarningModal } from "@/app/(dashboard)/_components/ui/modals/warning-modal";
import { BulkActionBar } from "@/app/(dashboard)/_components/ui/toolbar/bulk-action-bar";
import { TASK_PRIORITY_OPTIONS } from "@/app/(dashboard)/_constants/task";
import { ConfirmDialog } from "@/components/ui/feedback/confirm-dialog";
import { useRecordSkeletonCount } from "@/hooks/use-skeleton-count";
import { applyArchiveOperationAction } from "@/lib/actions/archive-actions";
import { TRASH_RETENTION_DAYS } from "@/lib/constants/archive";
import { buildConfirmCopy } from "@/lib/constants/confirm-copy";
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

// component props - defines the interface for the initial projects data passed from the server.
export interface ProjectsClientProps {
	initialProjects: Project[];
}

// component signature - accepts initial projects prop for hydration.
export function ProjectsClient({ initialProjects }: ProjectsClientProps) {
	// state initialization - seeds the client-side store with server-rendered data for immediate interactivity.
	const { modals, selection, filters } = useProjectsClient(initialProjects);

	// skeleton hydration count - records the unfiltered project count to accurately size loading placeholders on subsequent visits.
	useRecordSkeletonCount("projects", initialProjects.length);
	const router = useRouter();

	/**
	 * handle archive project - performs server-side archiving and relies on
	 * router.refresh() rather than optimistic updates to ensure accurate server
	 * statistics and lists.
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

			{/* render modals - mounts all interactive dialogs required by the view. */}
			<ProjectModal
				isOpen={modals.create.isOpen}
				onClose={() => modals.create.setIsOpen(false)}
			/>

			{/* semantic confirmation text - uses buildConfirmCopy to generate grammatically correct warnings for single or multiple item deletions. */}
			<ConfirmDialog
				isOpen={modals.delete.isOpen}
				onClose={modals.delete.close}
				onConfirm={() => {
					selection.confirmDelete();
					modals.delete.close();
				}}
				tone="danger"
				{...buildConfirmCopy({
					action: "delete",
					subject: "project",
					count: deleteCount,
				})}
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
						? `This project has ongoing tasks. Are you sure you want to delete it? It moves to the trash, and is deleted permanently after ${TRASH_RETENTION_DAYS} days.`
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
