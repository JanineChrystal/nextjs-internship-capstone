"use client";

import { useEffect } from "react";
import { WarningModal } from "@/app/(dashboard)/_components/ui/modals/warning-modal";
import type { EditProjectFormValues } from "@/lib/validations/project-schema";
import { useEditProject } from "../../../_hooks/use-edit-project";
import { ProjectEditForm } from "./project-edit-form";
import { ProjectViewHeader } from "./project-view-header";

interface ProjectHeaderProps {
	projectId: string;
	project: EditProjectFormValues & { priority?: string };
}

export function ProjectHeader({ projectId, project }: ProjectHeaderProps) {
	const {
		isEditing,
		setIsEditing,
		form,
		onSubmit,
		onCancel,
		warningModal,
		setWarningModal,
		confirmWarningAction,
	} = useEditProject(projectId, project);

	useEffect(() => {
		if (isEditing) {
			setTimeout(() => {
				form.setFocus("title");
			}, 0);
		}
	}, [isEditing, form]);

	if (isEditing) {
		return (
			<>
				<ProjectEditForm
					project={project}
					form={form}
					onSubmit={onSubmit}
					onCancel={onCancel}
				/>
				<WarningModal
					isOpen={warningModal.isOpen}
					onClose={() =>
						setWarningModal({
							isOpen: false,
							actionType: null,
							pendingData: null,
						})
					}
					onConfirm={confirmWarningAction}
					title={
						warningModal.actionType === "completed"
							? "Mark as Completed"
							: "Archive Project"
					}
					message={
						warningModal.actionType === "completed"
							? "There are still ongoing tasks in this project. Are you sure you want to set it as completed?"
							: "There are still ongoing tasks in this project. Are you sure you want to archive it?"
					}
					variant="warning"
					confirmText={
						warningModal.actionType === "completed"
							? "Complete Anyway"
							: "Archive Anyway"
					}
				/>
			</>
		);
	}

	return (
		<ProjectViewHeader project={project} onEdit={() => setIsEditing(true)} />
	);
}
