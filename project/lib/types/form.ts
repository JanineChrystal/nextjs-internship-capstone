/**
 * One option in a select or combobox.
 *
 * Declared here rather than in the create-project constants that first needed
 * it: the same shape drives the edit-project form and the task property
 * dropdowns, and a constants file is for values, not type declarations.
 */
export type SelectOption = {
	label: string;
	value: string;
};

/**
 * A declaratively described form field, so the project modals can render their
 * inputs from an array instead of hand-writing each one.
 */
export type FormFieldConfig = {
	id: string;
	label: string;
	type: "text" | "date" | "datetime-local" | "select" | "creatable-combobox";
	placeholder?: string;
	options?: readonly SelectOption[];
};
