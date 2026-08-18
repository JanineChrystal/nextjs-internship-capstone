"use client";

import { useCallback, useEffect, useState } from "react";
import {
	getProjectPendingInvitesAction,
	getWorkspacePendingInvitesAction,
	revokePendingInviteAction,
} from "@/lib/actions/pending-invite-actions";
import type { PendingInviteOutputDTO } from "@/lib/dtos/pending-invite-dto";
import { reportActionError } from "@/lib/utils/toast";

/**
 * Loads and revokes pending invitations for one scope.
 *
 * Kept as a hook rather than a store because the two surfaces that show invites
 * never appear at once, so there is no shared state to coordinate - and a stale
 * list is more confusing than a second fetch is expensive.
 */
export function usePendingInvites(
	scope: "project" | "workspace",
	projectId?: string,
) {
	const [invites, setInvites] = useState<PendingInviteOutputDTO[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const load = useCallback(async () => {
		if (scope === "project" && !projectId) return;

		setIsLoading(true);
		const result =
			scope === "project"
				? await getProjectPendingInvitesAction(projectId as string)
				: await getWorkspacePendingInvitesAction();

		if (result.success && result.data) {
			setInvites(result.data);
		} else if (result.error) {
			reportActionError("Could not load pending invites", result.error);
		}
		setIsLoading(false);
	}, [scope, projectId]);

	const revoke = useCallback(async (inviteId: string) => {
		let previous: PendingInviteOutputDTO[] = [];

		// The snapshot is taken inside the updater rather than read from `invites`,
		// so this callback no longer depends on the list it mutates. Depending on
		// it rebuilt `revoke` on every change, which meant every row that received
		// it re-rendered whenever any invite was revoked.
		setInvites((current) => {
			previous = current;
			return current.filter((invite) => invite.id !== inviteId);
		});

		const result = await revokePendingInviteAction(inviteId);
		if (!result.success) {
			setInvites(previous);
			reportActionError("Could not revoke invite", result.error);
		}
	}, []);

	// Effects last, after every value they might close over has been declared.
	useEffect(() => {
		load();
	}, [load]);

	return { invites, isLoading, refresh: load, revoke };
}
