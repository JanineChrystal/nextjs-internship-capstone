"use client";

import { BaseModal } from "@/components/modals/base-modal";
import type { Project } from "@/lib/validations/project-schema";
import { CreateProjectModal } from "./create-project-modal";
import { EditProjectModal } from "./edit-project-modal";

export interface CreateProjectModalProps {
	isOpen: boolean;
	onClose: () => void;
	initialData?: Project;
	// Prefills start/due date when opened from a calendar date click - only
	// applies in create mode.
	prefillDate?: Date | null;
}

export function ProjectModal({
	isOpen,
	onClose,
	initialData,
	prefillDate,
}: CreateProjectModalProps) {
	const isEditMode = !!initialData;

	return (
		<BaseModal
			isOpen={isOpen}
			onClose={onClose}
			title={isEditMode ? "Edit Project" : "Create New Project"}
			maxWidth="4xl"
		>
			{isEditMode ? (
				<EditProjectModal onClose={onClose} initialData={initialData} />
			) : (
				<CreateProjectModal onClose={onClose} prefillDate={prefillDate} />
			)}
		</BaseModal>
	);
}
