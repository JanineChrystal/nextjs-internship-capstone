export const projectStatusOptions = [
	"Active",
	"Planning",
	"Completed",
] as const;

export type FormFieldConfig = {
	id: string;
	label: string;
	type: "text" | "date" | "select";
	placeholder?: string;
	options?: readonly string[];
};

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
