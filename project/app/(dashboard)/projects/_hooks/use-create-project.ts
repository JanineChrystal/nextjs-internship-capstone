import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
	type CreateProjectFormValues,
	createProjectSchema,
} from "@/lib/validations/project-schema";
import { useProjectStore } from "@/stores/use-project-store";

interface UseCreateProjectProps {
	onClose: () => void;
}

export function useCreateProject({ onClose }: UseCreateProjectProps) {
	const addProject = useProjectStore((state) => state.addProject);

	const form = useForm<CreateProjectFormValues>({
		resolver: zodResolver(createProjectSchema),
		defaultValues: {
			title: "",
			status: "active",
			category: "",
			startDate: "",
			dueDate: "",
			description: "",
		},
	});

	const onSubmit = form.handleSubmit((data: CreateProjectFormValues) => {
		addProject({
			...data,
			daysLeft: 30,
			membersCount: 1,
			tasksCount: 0,
			progress: 0,
			priority: "low",
			isOwned: true,
			isAssigned: false,
		});

		form.reset();
		onClose();
	});

	return {
		form,
		onSubmit,
		errors: form.formState.errors,
		isSubmitting: form.formState.isSubmitting,
	};
}
