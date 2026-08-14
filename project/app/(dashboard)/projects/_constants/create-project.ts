export type SelectOption = {
	label: string;
	value: string;
};

export type FormFieldConfig = {
	id: string;
	label: string;
	type: "text" | "date" | "datetime-local" | "select" | "creatable-combobox";
	placeholder?: string;
	options?: readonly SelectOption[];
};

export const projectStatusOptions = [
	{ label: "Active", value: "active" },
	{ label: "Completed", value: "completed" },
	{ label: "Overdue", value: "overdue" },
	{ label: "Archived", value: "archived" },
] as const;

export const projectPriorityOptions = [
	{ label: "Low", value: "low" },
	{ label: "Medium", value: "medium" },
	{ label: "High", value: "high" },
	{ label: "Urgent", value: "urgent" },
] as const;

export const projectFormFields: FormFieldConfig[] = [
	{
		id: "status",
		label: "Status",
		type: "select",
		options: projectStatusOptions,
	},
	{
		id: "priority",
		label: "Priority",
		type: "select",
		options: projectPriorityOptions,
	},
	{
		id: "category",
		label: "Category",
		type: "creatable-combobox",
		placeholder: "e.g., Development",
	},
	{
		id: "startDate",
		label: "Start Date",
		type: "datetime-local",
	},
	{
		id: "dueDate",
		label: "Due Date",
		type: "datetime-local",
	},
];
