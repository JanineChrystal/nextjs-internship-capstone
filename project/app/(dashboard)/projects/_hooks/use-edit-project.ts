import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
	type EditProjectFormValues,
	editProjectSchema,
} from "@/lib/validations/project-schema";
import { useProjectStore } from "@/stores/use-project-store";

export function useEditProject(
	projectId: string,
	initialData: EditProjectFormValues,
) {
	// External Stores
	const updateProject = useProjectStore((state) => state.updateProject);

	// Local/External Hooks
	const [isEditing, setIsEditing] = useState(false);
	const form = useForm<EditProjectFormValues>({
		resolver: zodResolver(editProjectSchema),
		defaultValues: initialData,
	});

	// Handlers
	const onSubmit = form.handleSubmit((data) => {
		updateProject(projectId, data);
		setIsEditing(false);
	});

	const onCancel = () => {
		form.reset(initialData);
		setIsEditing(false);
	};

	return {
		isEditing,
		setIsEditing,
		form,
		onSubmit,
		onCancel,
	};
}
