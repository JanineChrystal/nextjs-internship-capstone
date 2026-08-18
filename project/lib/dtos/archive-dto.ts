/**
 * One row in the Archive or Trash list.
 *
 * Projects and tasks are deliberately flattened into a single shape rather than
 * kept as two lists. The reader's question on this page is "what did I put
 * aside, and when" - not "show me projects, then tasks" - and one shape means
 * one table, one set of action buttons, and no chance of the two drifting into
 * behaving differently.
 *
 * `kind` is what the actions dispatch on, so the row itself carries everything
 * needed to act on it.
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
