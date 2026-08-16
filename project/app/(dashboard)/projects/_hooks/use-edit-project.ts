import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { updateProjectAction } from "@/lib/actions/project-actions";
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
	const [warningModal, setWarningModal] = useState<{
		isOpen: boolean;
		actionType: "completed" | "archived" | null;
		pendingData: EditProjectFormValues | null;
	}>({ isOpen: false, actionType: null, pendingData: null });

	const form = useForm<EditProjectFormValues>({
		resolver: zodResolver(editProjectSchema),
		// Surface schedule errors as soon as a date is picked, matching how the
		// task modal validates, rather than only on submit.
		mode: "onChange",
		defaultValues: initialData,
	});

	// Derived
	const projects = useProjectStore((state) => state.projects);

	const checkHasIncompleteTasks = useCallback(() => {
		return projects.some(
			(p) =>
				p.id === projectId &&
				(p.tasksCount ?? 0) > 0 &&
				(p.progress ?? 0) < 100,
		);
	}, [projects, projectId]);

	// Handlers
	const confirmSubmit = async (data: EditProjectFormValues) => {
		// Store previous state for rollback
		const previousProject = useProjectStore
			.getState()
			.projects.find((p) => p.id === projectId);

		// Optimistic update
		updateProject(projectId, data);
		setIsEditing(false);
		setWarningModal({ isOpen: false, actionType: null, pendingData: null });

		const formData = new FormData();
		Object.entries(data).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				formData.append(key, value.toString());
			}
		});

		try {
			const result = await updateProjectAction(projectId, formData);
			if (!result.success && previousProject) {
				// Rollback
				updateProject(projectId, previousProject);
				console.error("Failed to update project:", result.error);
			}
		} catch (error) {
			if (previousProject) {
				updateProject(projectId, previousProject);
			}
			console.error("Error updating project:", error);
		}
	};

	const onSubmit = form.handleSubmit((data) => {
		// Check if we are changing status to completed or archived
		const newStatus = data.status;
		const oldStatus = initialData.status;

		if (
			newStatus !== oldStatus &&
			(newStatus === "completed" || newStatus === "archived") &&
			checkHasIncompleteTasks()
		) {
			setWarningModal({
				isOpen: true,
				actionType: newStatus,
				pendingData: data,
			});
		} else {
			confirmSubmit(data);
		}
	});

	const confirmWarningAction = () => {
		if (warningModal.pendingData) {
			confirmSubmit(warningModal.pendingData);
		}
	};

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
		warningModal,
		setWarningModal,
		confirmWarningAction,
	};
}
