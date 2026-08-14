"use client";

import { Archive, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { WarningModal } from "@/app/(dashboard)/_components/ui/modals/warning-modal";
import { Button } from "@/components/ui/buttons/button";
import { SectionTitle } from "@/components/ui/sections";
import type { RoleAccess } from "@/types/member";
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
		isDeleteModalOpen,
		setIsDeleteModalOpen,
		warningModal,
		setWarningModal,
		confirmWarningAction,
		isOwner,
		handleToggleArchive,
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
									onClick={handleToggleArchive}
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

			<DeleteProjectModal
				open={isDeleteModalOpen}
				onOpenChange={setIsDeleteModalOpen}
				projectName={projectName}
				onConfirmDelete={handleDeleteProject}
			/>

			<WarningModal
				isOpen={warningModal.isOpen}
				onClose={() => setWarningModal({ isOpen: false, actionType: null })}
				onConfirm={confirmWarningAction}
				title={
					warningModal.actionType === "delete"
						? "Delete Project"
						: "Archive Project"
				}
				message={
					warningModal.actionType === "delete"
						? "This project has ongoing tasks. Are you sure you want to delete it? This action cannot be undone."
						: "There are still ongoing tasks in this project. Are you sure you want to archive it?"
				}
				variant={warningModal.actionType === "delete" ? "danger" : "warning"}
				confirmText={
					warningModal.actionType === "delete"
						? "Delete Anyway"
						: "Archive Anyway"
				}
			/>
		</section>
	);
}
