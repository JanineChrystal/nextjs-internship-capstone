import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import {
	type ContactMessageDTO,
	toContactMessageDTO,
} from "@/lib/dtos/contact-dto";
import type { NewDbContactMessage } from "@/lib/types/contact";
import { encrypt, deterministicEncrypt } from "@/lib/utils/encryption";

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
		const encryptedData = {
			...data,
			name: encrypt(data.name) || data.name,
			email: deterministicEncrypt(data.email) || data.email,
			organization: data.organization ? encrypt(data.organization) || data.organization : data.organization,
			message: encrypt(data.message) || data.message,
		};
		const [row] = await db.insert(contactMessages).values(encryptedData).returning();
		return toContactMessageDTO(row);
	} catch (error) {
		throw new Error("Failed to save contact message", { cause: error });
	}
}

/**
 * Records that the alert for a message reached somebody.
 *
 * Separate from the insert, and run afterwards, because the two answer different
 * questions and fail independently: the insert is whether we still have the
 * message, this is whether anyone was told about it. Writing one timestamp at
 * insert time and hoping would mean a row that claims it was announced during an
 * outage in which nothing was.
 *
 * A failure here is swallowed by the caller for the same reason the delivery
 * itself is - the message is safe either way, and nothing the sender sees
 * depends on it.
 */
export async function markContactMessageNotifiedDAL(id: string): Promise<void> {
	try {
		await db
			.update(contactMessages)
			.set({ notifiedAt: new Date(), updatedAt: new Date() })
			.where(eq(contactMessages.id, id));
	} catch (error) {
		throw new Error("Failed to mark contact message as notified", {
			cause: error,
		});
	}
}
