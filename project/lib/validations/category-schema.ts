import { z } from "zod";

/**
 * A colour as an <input type="color"> produces it. Anchored on both ends so a
 * hand-edited value cannot smuggle anything else into a style attribute.
 */
export const CategoryColorSchema = z
	.string()
	.regex(/^#[0-9a-f]{6}$/i, "Pick a colour");

export const EditCategorySchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Category name is required")
		.max(60, "Category name must be 60 characters or fewer"),
	color: CategoryColorSchema,
});

export type EditCategoryFormValues = z.infer<typeof EditCategorySchema>;
