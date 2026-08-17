import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { type Resolver, useForm } from "react-hook-form";
import type { z } from "zod";
import {
	AddProjectInviteSchema,
	AddWorkspaceInviteSchema,
} from "@/lib/validations/member-schema";
import { useMemberStore } from "@/stores/use-member-store";
import type { RoleAccess } from "@/types/member";

export type AddInviteFormValues = z.infer<typeof AddProjectInviteSchema>;

/**
 * `targetId` is the project id for project-scoped invites. Workspace-scoped
 * invites resolve the caller's own workspace server-side, so no id is passed.
 */
export function useAddMemberModal(
	targetId: string,
	scope: "project" | "workspace",
	onOpenChange: (open: boolean) => void,
) {
	const {
		pendingInvites,
		addPendingInvite,
		removePendingInvite,
		clearPendingInvites,
		sendBulkInvites,
	} = useMemberStore();

	// The workspace form renders neither a position nor an access-level field, so
	// it must not be validated against the project schema that requires them.
	const form = useForm<AddInviteFormValues>({
		resolver: zodResolver(
			scope === "project" ? AddProjectInviteSchema : AddWorkspaceInviteSchema,
		) as Resolver<AddInviteFormValues>,
		defaultValues: {
			recipient: "",
			jobRole: "",
			roleAccess: "member",
		},
	});

	const handleAddStaged = useCallback(
		(values: AddInviteFormValues) => {
			if (!values.recipient.trim()) return;
			if (scope === "project" && !values.jobRole?.trim()) return;

			addPendingInvite({
				recipient: values.recipient.trim(),
				jobRole: values.jobRole?.trim() || "Member",
				// Workspace invites render no access-level field, so the value is
				// absent rather than empty and needs a default of its own.
				roleAccess: (values.roleAccess ?? "member") as Exclude<
					RoleAccess,
					"owner"
				>,
			});

			form.reset();
		},
		[addPendingInvite, form, scope],
	);

	const handleSendAll = useCallback(async () => {
		await sendBulkInvites(scope, targetId);
		onOpenChange(false);
	}, [sendBulkInvites, scope, targetId, onOpenChange]);

	const handleCancel = useCallback(() => {
		clearPendingInvites();
		onOpenChange(false);
	}, [clearPendingInvites, onOpenChange]);

	return {
		pendingInvites,
		removePendingInvite,
		form,
		handleAddStaged,
		handleSendAll,
		handleCancel,
	};
}
