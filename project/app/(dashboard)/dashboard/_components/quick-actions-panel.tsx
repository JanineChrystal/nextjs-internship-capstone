"use client";

import dynamic from "next/dynamic";
import { BaseCard } from "@/components/ui/cards/base-card";
import type { ProjectPickerOption } from "@/lib/types/dashboard";
import { ProjectPickerModal } from "../../_components/ui/modals/project-picker-modal";
import {
	PROJECT_PICKER_COPY,
	QUICK_ACTIONS,
} from "../_constants/quick-actions";
import { useQuickActions } from "../_hooks/use-quick-actions";

/**
 * dynamic modals - defers loading heavy action modals until a user
 * invokes a shortcut, keeping the initial dashboard bundle lightweight.
 */
const ProjectModal = dynamic(
	() =>
		import("../../_components/ui/modals/project-modal/project-modal").then(
			(m) => m.ProjectModal,
		),
	{ ssr: false },
);

const AddMemberModal = dynamic(
	() =>
		import(
			"../../_components/ui/modals/add-member-modal/add-member-modal"
		).then((m) => m.AddMemberModal),
	{ ssr: false },
);

const TaskModal = dynamic(
	() =>
		import("../../_components/ui/modals/task-modal/task-modal").then(
			(m) => m.TaskModal,
		),
	{ ssr: false },
);

/**
 * quick actions panel - provides shortcuts for common tasks by opening
 * existing shared modals rather than duplicating form logic, mounting the
 * task modal conditionally when triggered.
 */
export function QuickActionsPanel({
	projects,
}: {
	projects: ProjectPickerOption[];
}) {
	const {
		activeAction,
		pickedProjectId,
		isPickingProject,
		isPreparing,
		start,
		selectProject,
		reset,
	} = useQuickActions();

	const pickerCopy =
		activeAction === "create-task" || activeAction === "add-project-member"
			? PROJECT_PICKER_COPY[activeAction]
			: null;

	return (
		<BaseCard className="hover:scale-100 gap-4">
			<h2 className="text-base font-semibold text-on-surface">Quick Actions</h2>

			<ul className="flex flex-col gap-1">
				{QUICK_ACTIONS.map((action) => (
					<li key={action.id}>
						<button
							type="button"
							onClick={() => start(action.id)}
							className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-surface-container focus-visible:bg-surface-container focus-visible:outline-2 focus-visible:outline-primary"
						>
							<action.icon
								className="h-4 w-4 shrink-0 text-primary"
								aria-hidden="true"
							/>
							<span className="flex min-w-0 flex-1 flex-col">
								<span className="text-sm text-on-surface">{action.label}</span>
								<span className="truncate text-xs text-secondary">
									{action.description}
								</span>
							</span>
						</button>
					</li>
				))}
			</ul>

			{/* step one - renders the project picker for project-scoped quick actions. */}
			{pickerCopy && (
				<ProjectPickerModal
					isOpen={isPickingProject}
					onClose={reset}
					onSelect={selectProject}
					projects={projects}
					title={pickerCopy.title}
					description={pickerCopy.description}
					confirmLabel={pickerCopy.confirmLabel}
					requiredPermission={pickerCopy.requiredPermission}
					deniedHint={pickerCopy.deniedHint}
					isBusy={isPreparing}
				/>
			)}

			<ProjectModal
				isOpen={activeAction === "create-project"}
				onClose={reset}
			/>

			<AddMemberModal
				open={activeAction === "add-workspace-member"}
				onOpenChange={(open) => {
					if (!open) reset();
				}}
				scope="workspace"
			/>

			{/* conditional invite modal - ensures the member addition modal only mounts after a valid project ID is selected. */}
			{activeAction === "add-project-member" && pickedProjectId && (
				<AddMemberModal
					open
					onOpenChange={(open) => {
						if (!open) reset();
					}}
					scope="project"
					targetId={pickedProjectId}
				/>
			)}

			<TaskModal />
		</BaseCard>
	);
}
