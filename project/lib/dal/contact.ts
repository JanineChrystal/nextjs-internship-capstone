import "server-only";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import {
	type ContactMessageDTO,
	toContactMessageDTO,
} from "@/lib/dtos/contact-dto";
import type { NewDbContactMessage } from "@/lib/types/contact";

/**
 * The one DAL function in this codebase that does not call getCurrentUser().
 *
 * Every other read and write here starts by resolving a session and scoping to
 * what that person may touch. This one deliberately does not, because a contact
 * form that required an account would only be reachable by people who already
 * have one - which is nobody the landing page is written for.
 *
 * The protections that replace the session check live in the action above it:
 * schema validation, the honeypot, and an IP rate limit. They are named here so
 * the missing auth check reads as a decision rather than an omission, and so
 * nobody "fixes" it later by bolting a session onto a public form.
 */
export async function createContactMessageDAL(
	data: NewDbContactMessage,
): Promise<ContactMessageDTO> {
	try {
		const [row] = await db.insert(contactMessages).values(data).returning();
		return toContactMessageDTO(row);
	} catch (error) {
		throw new Error("Failed to save contact message", { cause: error });
	}
}
