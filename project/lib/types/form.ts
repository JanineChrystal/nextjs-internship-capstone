/**
 * select option - represents a single key-value pair for dropdowns, located
 * here instead of in constants to decouple type definitions from values.
 */
export type SelectOption = {
	label: string;
	value: string;
};

/**
 * form field config - declarative configuration for rendering dynamic form
 * inputs, enabling arrays to drive project modals instead of hand-writing
 * individual fields.
 */
export type FormFieldConfig = {
	id: string;
	label: string;
	type: "text" | "date" | "datetime-local" | "select" | "creatable-combobox";
	placeholder?: string;
	options?: readonly SelectOption[];
};
