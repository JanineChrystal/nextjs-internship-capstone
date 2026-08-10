"use client";

import { Archive, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/buttons/button";
import type { RoleAccess } from "@/types/member";
import { DeleteProjectModal } from "./delete-project-modal";

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
	const [isArchiveActive, setIsArchiveActive] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	const isOwner = currentUserRole === "owner";

	const handleDeleteProject = () => {
		// Mock action
		alert(`Project ${projectId} deleted successfully.`);
	};

	return (
		<section className="bg-surface rounded-xl border border-error/20 p-6 flex flex-col gap-6 relative overflow-hidden">
			{/* Subtly tinted background for danger zone */}
			<div className="absolute inset-0 bg-error/5 pointer-events-none" />

			<div className="relative z-10">
				<h2 className="text-xl font-bold text-error">Danger Zone</h2>
				<p className="text-sm text-secondary">
					Destructive actions that permanently affect this project and its data.
				</p>
			</div>

			<div className="relative z-10 flex flex-col gap-4 border border-error/20 rounded-lg p-4 bg-surface-container-lowest">
				{/* Archive Project */}
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2 border-b border-error/10 pb-4">
					<div>
						<h3 className="font-semibold text-on-surface flex items-center gap-2">
							<Archive size={18} className="text-secondary" />
							Archive Project
						</h3>
						<p className="text-xs text-secondary mt-1">
							Mark this project as archived. It will be hidden from active
							dashboards but data remains intact.
						</p>
					</div>
					<Button
						variant="outline"
						onClick={() => setIsArchiveActive(!isArchiveActive)}
						className="border-outline-variant text-on-surface hover:bg-surface-variant shrink-0"
					>
						<Archive size={16} className="mr-2 text-secondary" />
						{isArchiveActive ? "Unarchive Project" : "Archive Project"}
					</Button>
				</div>

				{/* Delete Project */}
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2">
					<div>
						<h3 className="font-semibold text-error flex items-center gap-2">
							<Trash2 size={18} />
							Delete Project
						</h3>
						<p className="text-xs text-secondary mt-1 max-w-xl">
							Permanently delete this project, all tasks, comments, and member
							associations. This action cannot be undone.
						</p>
					</div>
					<Button
						variant="destructive"
						disabled={!isOwner}
						onClick={() => setIsDeleteModalOpen(true)}
						className="bg-error text-error-foreground hover:bg-error/90 disabled:opacity-50"
						title={
							!isOwner
								? "Only the Project Owner can delete this project."
								: undefined
						}
					>
						Delete Project
					</Button>
				</div>
			</div>

			<DeleteProjectModal
				open={isDeleteModalOpen}
				onOpenChange={setIsDeleteModalOpen}
				projectName={projectName}
				onConfirmDelete={handleDeleteProject}
			/>
		</section>
	);
}
