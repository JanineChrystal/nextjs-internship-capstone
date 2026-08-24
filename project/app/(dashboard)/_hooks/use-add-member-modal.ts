import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { type Resolver, useForm } from "react-hook-form";
import type { z } from "zod";
import type { RoleAccess } from "@/lib/types/member";
import {
	AddProjectInviteSchema,
	AddWorkspaceInviteSchema,
} from "@/lib/validations/member-schema";
import { useMemberStore } from "@/stores/use-member-store";

export type AddInviteFormValues = z.infer<typeof AddProjectInviteSchema>;

/**
 * add member modal hook - manages form state and staging for member invitations.
 * `targetId` is required for projects, but omitted for workspaces as they are resolved on the server.
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

	// dynamic schema validation - switches validation schemas based on scope to avoid errors on fields the workspace form doesn't render.
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
				// default role access - provides a default 'member' role for workspace invites since the field is not rendered.
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
