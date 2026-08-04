// src/app/(dashboard)/projects/_constants/create-project.ts

// 1. Define a strict type for your options
export type SelectOption = {
	label: string;
	value: string;
};

// 2. Update the config to accept the object array
export type FormFieldConfig = {
	id: string;
	label: string;
	type: "text" | "date" | "select";
	placeholder?: string;
	options?: readonly SelectOption[];
};

// 3. Keep ONLY the object-based constant
export const projectStatusOptions = [
	{ label: "Active", value: "active" },
	{ label: "Planning", value: "planning" },
	{ label: "Completed", value: "completed" },
] as const;

// 4. Your fields array remains exactly the same
export const projectFormFields: FormFieldConfig[] = [
	{
		id: "status",
		label: "Status",
		type: "select",
		options: projectStatusOptions,
	},
	{
		id: "category",
		label: "Category",
		type: "text",
		placeholder: "e.g., Development",
	},
	{
		id: "startDate",
		label: "Start Date",
		type: "date",
	},
	{
		id: "dueDate",
		label: "Due Date",
		type: "date",
	},
];
