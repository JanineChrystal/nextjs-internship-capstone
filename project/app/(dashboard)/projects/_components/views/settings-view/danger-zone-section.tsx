"use client";

import { Archive, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/buttons/button";
import { ConfirmDialog } from "@/components/ui/feedback/confirm-dialog";
import { SectionTitle } from "@/components/ui/sections";
import type { RoleAccess } from "@/lib/types/member";
import {
	DANGER_ZONE_ACTIONS,
	settingsSectionTexts,
} from "../../../_constants/settings-view";
import { useDangerZone } from "../../../_hooks/use-danger-zone";

const DeleteProjectModal = dynamic(
	() => import("./delete-project-modal").then((m) => m.DeleteProjectModal),
	{ ssr: false },
);

interface DangerZoneSectionProps {
	projectId: string;
	projectName: string;
	currentUserRole: RoleAccess;
}

export function DangerZoneSection({
	projectId,
	projectName,
	currentUserRole,
}: DangerZoneSectionProps) {
	const {
		isArchiveActive,
		isOwner,
		archiveConfirm,
		hasIncompleteTasks,
		requestArchiveToggle,
		closeArchiveConfirm,
		confirmArchive,
		isDeleteModalOpen,
		setIsDeleteModalOpen,
		isDeleting,
		handleOpenDeleteModal,
		handleDeleteProject,
	} = useDangerZone(projectId, currentUserRole);

	return (
		<section className="bg-surface rounded-xl border border-error/20 p-6 flex flex-col gap-6 relative overflow-hidden">
			<div className="absolute inset-0 bg-error/5 pointer-events-none" />

			<div className="relative z-10">
				<SectionTitle
					title={settingsSectionTexts.dangerZone.title}
					description={settingsSectionTexts.dangerZone.description}
					titleClassName="text-error"
				/>
			</div>

			<div className="relative z-10 flex flex-col gap-4 border border-error/20 rounded-lg p-4 bg-surface-container-lowest">
				{DANGER_ZONE_ACTIONS.map((action, index) => {
					const isArchive = action.id === "archive";
					const isLast = index === DANGER_ZONE_ACTIONS.length - 1;

					return (
						<div
							key={action.id}
							className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2 ${
								!isLast ? "border-b border-error/10 pb-4" : ""
							}`}
						>
							<div>
								<h3
									className={`font-semibold flex items-center gap-2 ${
										action.isDestructive ? "text-error" : "text-on-surface"
									}`}
								>
									{isArchive ? (
										<Archive size={18} className="text-secondary" />
									) : (
										<Trash2 size={18} />
									)}
									{action.title}
								</h3>
								<p className="text-xs text-secondary mt-1 max-w-xl">
									{action.description}
								</p>
							</div>

							{isArchive ? (
								<Button
									type="button"
									variant="outline"
									onClick={requestArchiveToggle}
									className="border-outline-variant text-on-surface hover:bg-surface-variant shrink-0"
								>
									<Archive size={16} className="mr-2 text-secondary" />
									{isArchiveActive ? "Unarchive Project" : "Archive Project"}
								</Button>
							) : (
								<Button
									type="button"
									variant="destructive"
									disabled={!isOwner}
									onClick={handleOpenDeleteModal}
									className="bg-error text-error-foreground hover:bg-error/90 disabled:opacity-50"
									title={
										!isOwner
											? "Only the Project Owner can delete this project."
											: undefined
									}
								>
									Delete Project
								</Button>
							)}
						</div>
					);
				})}
			</div>

			{/* confirmation modal - integrates open task warnings directly into the name-typing confirmation to streamline the deletion flow. */}
			<DeleteProjectModal
				open={isDeleteModalOpen}
				onOpenChange={setIsDeleteModalOpen}
				projectName={projectName}
				onConfirmDelete={handleDeleteProject}
				openTaskWarning={hasIncompleteTasks}
				isDeleting={isDeleting}
			/>

			<ConfirmDialog
				isOpen={archiveConfirm.isOpen}
				onClose={closeArchiveConfirm}
				onConfirm={confirmArchive}
				tone={archiveConfirm.hasOpenTasks ? "warning" : "info"}
				title={
					archiveConfirm.isArchiving
						? "Archive this project?"
						: "Restore this project?"
				}
				description={
					archiveConfirm.isArchiving
						? archiveConfirm.hasOpenTasks
							? "It disappears from active dashboards for everyone on it, and it still has unfinished tasks. Nothing is deleted - you can restore it from here at any time."
							: "It disappears from active dashboards for everyone on it. Nothing is deleted - you can restore it from here at any time."
						: "It returns to active dashboards for everyone on it."
				}
				confirmLabel={
					archiveConfirm.isArchiving ? "Archive project" : "Restore project"
				}
			/>
		</section>
	);
}
