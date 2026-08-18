"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { applyArchiveOperationAction } from "@/lib/actions/archive-actions";
import type { ArchiveOperation } from "@/lib/dal/archive";
import type { ArchivedItemDTO, ArchivePageDTO } from "@/lib/dtos/archive-dto";
import { reportActionError, reportActionSuccess } from "@/lib/utils/toast";

/**
 * The archive page's list state.
 *
 * Optimistic like every other mutation here - the row leaves the list the moment
 * the button is pressed - but with one difference worth noting: after the server
 * confirms, `router.refresh()` re-runs the server component instead of the hook
 * patching the other list by hand. Unarchiving does not just remove a row, it
 * also has to reappear on /projects; letting the server recompute both lists is
 * both less code and the only version that cannot drift out of sync with what a
 * reload would show.
 */
export function useArchive(initial: ArchivePageDTO) {
	const router = useRouter();
	const [isRefreshing, startTransition] = useTransition();

	const [archived, setArchived] = useState(initial.archived);
	const [trashed, setTrashed] = useState(initial.trashed);
	const [busyId, setBusyId] = useState<string | null>(null);

	// `initial` is a fresh object on every server render, so this runs exactly
	// once per refresh and never in a loop. Without it the optimistic lists would
	// be the only ones the page ever showed, and the server's recomputed answer -
	// including anything the visit's purge sweep removed - would be discarded.
	useEffect(() => {
		setArchived(initial.archived);
		setTrashed(initial.trashed);
	}, [initial]);

	async function apply(
		item: ArchivedItemDTO,
		operation: ArchiveOperation,
		successMessage: string,
	) {
		// Snapshots taken before the optimistic removal, so a failure restores
		// exactly what was on screen.
		const previousArchived = archived;
		const previousTrashed = trashed;

		const remove = (rows: ArchivedItemDTO[]) =>
			rows.filter((row) => !(row.id === item.id && row.kind === item.kind));

		setBusyId(item.id);
		setArchived(remove);
		setTrashed(remove);

		const result = await applyArchiveOperationAction(
			item.kind,
			item.id,
			operation,
		);

		setBusyId(null);

		if (!result.success) {
			setArchived(previousArchived);
			setTrashed(previousTrashed);
			reportActionError("Could not complete that action", result.error);
			return;
		}

		reportActionSuccess(successMessage);

		// Moving between the two tabs is the common case, so the authoritative
		// lists are re-read rather than guessed at here.
		startTransition(() => router.refresh());
	}

	return {
		archived,
		trashed,
		busyId,
		isRefreshing,
		apply,
	};
}
