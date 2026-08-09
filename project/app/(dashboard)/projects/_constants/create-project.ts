export type SelectOption = {
	label: string;
	value: string;
};

export type FormFieldConfig = {
	id: string;
	label: string;
	type: "text" | "date" | "select";
	placeholder?: string;
	options?: readonly SelectOption[];
};

export const projectStatusOptions = [
	{ label: "Active", value: "active" },
	{ label: "Planning", value: "planning" },
	{ label: "Completed", value: "completed" },
] as const;

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
