import { z } from "zod";

export const userInputSchema = z.object({
	email: z.email({ error: "Invalid email format" }),
	password: z.string().min(8),
});

export const userOutputSchema = z.object({
	id: z.string(),
	email: z.email(),
	firstName: z.string().nullable(),
});

export type UserInputDTO = z.infer<typeof userInputSchema>;
export type UserOutputDTO = z.infer<typeof userOutputSchema>;
