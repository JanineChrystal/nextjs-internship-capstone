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
	const [isEditing, setIsEditing] = useState(false);
	const updateProject = useProjectStore((state) => state.updateProject);

	const form = useForm<EditProjectFormValues>({
		resolver: zodResolver(editProjectSchema),
		defaultValues: initialData,
	});

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
