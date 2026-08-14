import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { createProjectAction } from "@/lib/actions/project-actions";
import {
	type CreateProjectFormValues,
	createProjectSchema,
	type Project,
} from "@/lib/validations/project-schema";
import { useProjectStore } from "@/stores/use-project-store";

interface UseCreateProjectProps {
	onClose: () => void;
}

export function useCreateProject({ onClose }: UseCreateProjectProps) {
	// External Stores
	const addProject = useProjectStore((state) => state.addProject);

	// Local/External Hooks (State equivalent)
	const form = useForm<CreateProjectFormValues>({
		resolver: zodResolver(createProjectSchema),
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

	// Handlers
	const onSubmit = form.handleSubmit(async (data: CreateProjectFormValues) => {
		const tempId = crypto.randomUUID();

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
				console.error("Failed to create project:", result.error);
			}
		} catch (error) {
			const deleteProjects = useProjectStore.getState().deleteProjects;
			deleteProjects(new Set([tempId]));
			console.error("Error creating project:", error);
		}
	});

	return {
		form,
		errors: form.formState.errors,
		isSubmitting: form.formState.isSubmitting,
		onSubmit,
	};
}
