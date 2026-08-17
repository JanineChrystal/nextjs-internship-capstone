import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { createProjectAction } from "@/lib/actions/project-actions";
import { reportActionError } from "@/lib/utils/toast";
import {
	type CreateProjectFormValues,
	createProjectSchema,
	type Project,
} from "@/lib/validations/project-schema";
import { useProjectStore } from "@/stores/use-project-store";

interface UseCreateProjectProps {
	onClose: () => void;
	// Prefills start/due date when opened from a calendar date click.
	prefillDate?: Date | null;
}

// Matches the format a native <input type="datetime-local"> expects/emits.
function toDatetimeLocalValue(date: Date): string {
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function useCreateProject({
	onClose,
	prefillDate,
}: UseCreateProjectProps) {
	// External Stores
	const addProject = useProjectStore((state) => state.addProject);

	// Local/External Hooks (State equivalent)
	const form = useForm<CreateProjectFormValues>({
		resolver: zodResolver(createProjectSchema),
		// Surface schedule errors as soon as a date is picked, matching how the
		// task modal validates, rather than only on submit.
		mode: "onChange",
		defaultValues: {
			title: "",
			status: "active",
			category: "",
			priority: "low",
			startDate: "",
			dueDate: "",
			description: "",
		},
	});

	// CreateProjectModal stays mounted (only visually hidden) between opens,
	// so react-hook-form's one-time defaultValues won't pick up a new
	// prefillDate on its own - reset explicitly whenever it changes.
	useEffect(() => {
		const value = prefillDate ? toDatetimeLocalValue(prefillDate) : "";
		form.setValue("startDate", value);
		form.setValue("dueDate", value);
	}, [prefillDate, form.setValue]);

	// Handlers
	const onSubmit = form.handleSubmit(
		async (formValues: CreateProjectFormValues) => {
			const tempId = crypto.randomUUID();
			const data = {
				...formValues,
				category: formValues.category?.trim() || "Uncategorized",
			};

			const optimisticProject = {
				...data,
				id: tempId,
				daysLeft: 30,
				membersCount: 1,
				tasksCount: 0,
				progress: 0,
				priority: data.priority || "low",
				isOwned: true,
				isAssigned: false,
			};

			addProject(optimisticProject as Project);
			form.reset();
			onClose();

			const formData = new FormData();
			Object.entries(data).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					formData.append(key, value.toString());
				}
			});

			try {
				const result = await createProjectAction("default", formData);

				if (result.success && result.data) {
					const updateProject = useProjectStore.getState().updateProject;
					// Replace the temporary optimistic ID with the real DB ID
					updateProject(tempId, {
						...result.data,
						id: result.data.id,
					} as unknown as Project);
				} else {
					const deleteProjects = useProjectStore.getState().deleteProjects;
					deleteProjects(new Set([tempId]));
					reportActionError("Could not create project", result.error);
				}
			} catch (error) {
				const deleteProjects = useProjectStore.getState().deleteProjects;
				deleteProjects(new Set([tempId]));
				reportActionError("Could not create project", error);
			}
		},
	);

	return {
		form,
		errors: form.formState.errors,
		isSubmitting: form.formState.isSubmitting,
		onSubmit,
	};
}
