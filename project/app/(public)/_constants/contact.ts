import { CONTACT_TOPIC_LABELS } from "@/lib/constants/contact";
import {
	CONTACT_TOPICS,
	type ContactTopic,
} from "@/lib/validations/contact-schema";

/**
 * The topic options, as label/value pairs for the select.
 *
 * Built from the same two sources the rest of the pipeline uses rather than
 * typed out again: `CONTACT_TOPICS` is the array the zod schema and the database
 * enum are both derived from, and `CONTACT_TOPIC_LABELS` is what the
 * notification email and the Telegram alert print. So the dropdown physically
 * cannot offer a value the server would reject, and it cannot call something
 * "Request a walkthrough" while the email announcing it says "demo".
 *
 * The order the user sees is the order in the schema, which is also the order in
 * the database enum - one list, so there is nothing to keep in sync.
 */
export const CONTACT_TOPIC_OPTIONS: { value: ContactTopic; label: string }[] =
	CONTACT_TOPICS.map((value) => ({
		value,
		label: CONTACT_TOPIC_LABELS[value],
	}));

export const CONTACT_COPY = {
	title: "Talk to us",
	description:
		"Questions about the pilot, a walkthrough, or something that is not working. We read every message.",
	sentTitle: "Message sent",
	sentDescription:
		"Thanks - it is saved and we will reply to the address you gave us.",
} as const;
