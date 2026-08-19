import type { ContactTopic } from "@/lib/validations/contact-schema";

/**
 * The topic options, as label/value pairs for the select.
 *
 * The values are typed as `ContactTopic`, which is derived from the same array
 * the zod schema and the database enum are built from. That is what makes it
 * impossible for this dropdown to offer a value the server would reject: adding
 * an option here without adding it to the schema is a compile error, not a
 * runtime one someone discovers from a failed submission.
 */
export const CONTACT_TOPIC_OPTIONS: { value: ContactTopic; label: string }[] = [
	{ value: "general", label: "General question" },
	{ value: "demo", label: "Request a walkthrough" },
	{ value: "support", label: "Help with my account" },
	{ value: "partnership", label: "Partnership or pilot" },
];

export const CONTACT_COPY = {
	title: "Talk to us",
	description:
		"Questions about the pilot, a walkthrough, or something that is not working. We read every message.",
	sentTitle: "Message sent",
	sentDescription:
		"Thanks - it is saved and we will reply to the address you gave us.",
} as const;
