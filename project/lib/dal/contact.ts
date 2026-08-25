import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import {
	type ContactMessageDTO,
	toContactMessageDTO,
} from "@/lib/dtos/contact-dto";
import type { NewDbContactMessage } from "@/lib/types/contact";
import { encrypt } from "@/lib/utils/encryption";

/**
 * create contact message - intentionally omits session checks to allow
 * public landing page submissions, relying instead on action-layer
 * protections like honeypots and IP rate limits.
 */
export async function createContactMessageDAL(
	data: NewDbContactMessage,
): Promise<ContactMessageDTO> {
	try {
		const encryptedData = {
			...data,
			name: encrypt(data.name) || data.name,
			email: encrypt(data.email) || data.email,
			organization: data.organization
				? encrypt(data.organization) || data.organization
				: data.organization,
			message: encrypt(data.message) || data.message,
		};
		const [row] = await db
			.insert(contactMessages)
			.values(encryptedData)
			.returning();
		return toContactMessageDTO(row);
	} catch (error) {
		throw new Error("Failed to save contact message", { cause: error });
	}
}

/**
 * mark contact message notified - records successful notification delivery
 * separately from insertion to ensure the notifiedAt timestamp accurately
 * reflects real alerts, unaffected by outages.
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
