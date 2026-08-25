/**
 * archived item dto - flattens projects and tasks into a single row shape
 * for the Archive or Trash lists, unifying actions and table rendering to
 * prevent behavioral drift between entities.
 */
export type ArchivedItemKind = "project" | "task";

export interface ArchivedItemDTO {
	id: string;
	kind: ArchivedItemKind;
	name: string;
	/** The project a task belongs to. Null for a project row. */
	projectName: string | null;
	/** Needed to permission-check a task without another lookup. */
	projectId: string;
	/** When it was archived, or when it was trashed - whichever list it is in. */
	at: Date;
	/**
	 * Days before permanent deletion. Only meaningful for trashed rows; null in
	 * the archive, because archiving is not a countdown to anything.
	 */
	daysLeft: number | null;
}

export interface ArchivePageDTO {
	archived: ArchivedItemDTO[];
	trashed: ArchivedItemDTO[];
	/** How many expired rows the visit swept away, so the UI can say so. */
	purgedCount: number;
}
