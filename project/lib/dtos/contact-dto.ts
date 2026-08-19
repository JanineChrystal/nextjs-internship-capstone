import type { DbContactMessage } from "@/lib/types/contact";

/**
 * A contact message as anything outside the DAL is allowed to see it.
 *
 * `deletedAt` and `respondedAt` are dropped: they are triage bookkeeping, and
 * the only consumer today is the action that just wrote the row. Mapping through
 * a DTO even when the shapes are close is what stops a column added later -
 * an internal note, a spam score - from reaching a client component simply
 * because nobody remembered to strip it.
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
		name: row.name,
		email: row.email,
		organization: row.organization,
		topic: row.topic,
		message: row.message,
		createdAt: row.createdAt,
	};
}
