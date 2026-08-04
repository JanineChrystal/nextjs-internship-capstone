import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
	type CreateProjectFormValues,
	createProjectSchema,
} from "@/lib/validations/project-schema";

interface UseCreateProjectProps {
	onClose: () => void;
}

export function useCreateProject({ onClose }: UseCreateProjectProps) {
	// Pass CreateProjectFormValues to generic type parameter
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

	// 'data' is now fully typed as CreateProjectFormValues (no 'any'!)
	const onSubmit = form.handleSubmit((data: CreateProjectFormValues) => {
		console.log("Validated Project Data:", data);

		// TODO: Pass 'data' to Zustand store to save state

		form.reset();
		onClose();
	});

	return {
		form,
		onSubmit,
		// Expose errors easily for UI validation messages
		errors: form.formState.errors,
		isSubmitting: form.formState.isSubmitting,
	};
}
