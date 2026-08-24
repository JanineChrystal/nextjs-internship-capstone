"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { applyArchiveOperationAction } from "@/lib/actions/archive-actions";
import type { ArchiveOperation } from "@/lib/dal/archive";
import type { ArchivedItemDTO, ArchivePageDTO } from "@/lib/dtos/archive-dto";
import { reportActionError, reportActionSuccess } from "@/lib/utils/toast";

/**
 * use-archive hook - manages optimistic list removals and triggers a
 * server re-render via router.refresh() after confirmation to prevent
 * the client state from drifting out of sync.
 */
export function useArchive(initial: ArchivePageDTO) {
	const router = useRouter();
	const [isRefreshing, startTransition] = useTransition();

	const [archived, setArchived] = useState(initial.archived);
	const [trashed, setTrashed] = useState(initial.trashed);
	const [busyId, setBusyId] = useState<string | null>(null);

	// state sync - synchronizes the local optimistic state with the server's fresh initial data on every re-render to avoid discarding server-side updates.
	useEffect(() => {
		setArchived(initial.archived);
		setTrashed(initial.trashed);
	}, [initial]);

	async function apply(
		item: ArchivedItemDTO,
		operation: ArchiveOperation,
		successMessage: string,
	) {
		// optimistic rollback snapshots - stores list states before removal to allow exact restoration if the server operation fails.
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

		// server sync - refreshes the authoritative lists from the server instead of predicting cross-tab state changes locally.
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
