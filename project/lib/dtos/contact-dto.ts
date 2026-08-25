import type { DbContactMessage } from "@/lib/types/contact";
import { decrypt } from "@/lib/utils/encryption";

/**
 * contact message dto - defines a contact message stripped of internal
 * triage bookkeeping (like deletedAt) to prevent leaking future schema
 * additions to client components.
 */
export interface ContactMessageDTO {
	id: string;
	name: string;
	email: string;
	organization: string | null;
	topic: string;
	message: string;
	createdAt: Date;
}

export function toContactMessageDTO(row: DbContactMessage): ContactMessageDTO {
	return {
		id: row.id,
		name: decrypt(row.name) || row.name,
		email: decrypt(row.email) || row.email,
		organization: row.organization
			? decrypt(row.organization) || row.organization
			: row.organization,
		topic: row.topic,
		message: decrypt(row.message) || row.message,
		createdAt: row.createdAt,
	};
}
