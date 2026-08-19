import { z } from "zod";

/**
 * The one definition of a valid contact message, shared by the drawer form and
 * the server action.
 *
 * Sharing it matters more here than anywhere else in the app: this is the only
 * endpoint a complete stranger can reach. The form gives instant feedback and
 * the action re-validates from scratch, because a server action is a public HTTP
 * endpoint and cannot assume a browser ran any check at all - or that a browser
 * was involved.
 */
export const CONTACT_TOPICS = [
	"general",
	"demo",
	"support",
	"partnership",
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number];

/**
 * The honeypot.
 *
 * `website` is rendered as a real, empty, visually hidden input that no sighted
 * or screen-reader user is ever routed to (aria-hidden + tabIndex -1). A person
 * therefore always submits it empty; a bot that fills every field it finds
 * submits it full. Requiring it to be empty is a spam check that costs the user
 * nothing - no puzzle, no third-party script, no tracking.
 *
 * It is checked on the server, not just in the form. A honeypot validated only
 * in the browser stops nothing, since the bots worth stopping never render the
 * page.
 */
export const ContactMessageSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Please tell us your name")
		.max(80, "Name must be 80 characters or fewer"),
	email: z
		.string()
		.trim()
		.min(1, "Please enter an email address")
		.max(200, "Email must be 200 characters or fewer")
		.email("Please enter a valid email address"),
	organization: z
		.string()
		.trim()
		.max(120, "Organisation must be 120 characters or fewer")
		.optional()
		.or(z.literal("")),
	topic: z.enum(CONTACT_TOPICS),
	message: z
		.string()
		.trim()
		.min(10, "Please write at least 10 characters")
		.max(2000, "Message must be 2000 characters or fewer"),
	website: z
		.string()
		.max(0, "This field must be left empty")
		.optional()
		.or(z.literal("")),
});

export type ContactMessageFormValues = z.infer<typeof ContactMessageSchema>;
