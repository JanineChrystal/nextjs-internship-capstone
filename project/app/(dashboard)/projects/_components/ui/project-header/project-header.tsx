"use client";

import { useEffect } from "react";
import type { EditProjectFormValues } from "@/lib/validations/project-schema";
import { useEditProject } from "../../../_hooks/use-edit-project";
import { ProjectEditForm } from "./project-edit-form";
import { ProjectViewHeader } from "./project-view-header";

interface ProjectHeaderProps {
	projectId: string;
	project: EditProjectFormValues & { priority?: string };
}

export function ProjectHeader({ projectId, project }: ProjectHeaderProps) {
	const { isEditing, setIsEditing, form, onSubmit, onCancel } = useEditProject(
		projectId,
		project,
	);

	useEffect(() => {
		if (isEditing) {
			setTimeout(() => {
				form.setFocus("title");
			}, 0);
		}
	}, [isEditing, form]);

	if (isEditing) {
		return (
			<ProjectEditForm
				project={project}
				form={form}
				onSubmit={onSubmit}
				onCancel={onCancel}
			/>
		);
	}

	return (
		<ProjectViewHeader project={project} onEdit={() => setIsEditing(true)} />
	);
}
