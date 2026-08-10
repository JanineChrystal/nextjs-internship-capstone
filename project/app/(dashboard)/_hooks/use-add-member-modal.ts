import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AddInviteItemSchema } from "@/lib/validations/member-schema";
import { useMemberStore } from "@/stores/use-member-store";
import type { RoleAccess } from "@/types/member";

export type AddInviteFormValues = z.infer<typeof AddInviteItemSchema>;

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
		shareLinks,
		regenerateShareToken,
		updateDefaultShareRole,
	} = useMemberStore();

	const form = useForm<AddInviteFormValues>({
		resolver: zodResolver(AddInviteItemSchema),
		defaultValues: {
			recipient: "",
			jobRole: "",
			roleAccess: "member",
		},
	});

	const shareLinkConfig = useMemo(
		() => shareLinks[targetId],
		[shareLinks, targetId],
	);

	const shareUrl = useMemo(
		() =>
			shareLinkConfig
				? `https://app.takdaph.com/invite/${shareLinkConfig.inviteToken}`
				: "",
		[shareLinkConfig],
	);

	const handleAddStaged = useCallback(
		(values: AddInviteFormValues) => {
			if (!values.recipient.trim() || !values.jobRole.trim()) return;

			addPendingInvite({
				recipient: values.recipient.trim(),
				jobRole: values.jobRole.trim(),
				roleAccess: values.roleAccess as Exclude<RoleAccess, "guest" | "owner">,
			});

			form.reset();
		},
		[addPendingInvite, form],
	);

	const handleSendAll = useCallback(() => {
		sendBulkInvites(scope, targetId);
		onOpenChange(false);
	}, [sendBulkInvites, scope, targetId, onOpenChange]);

	const handleCancel = useCallback(() => {
		clearPendingInvites();
		onOpenChange(false);
	}, [clearPendingInvites, onOpenChange]);

	const handleCopyLink = useCallback(() => {
		navigator.clipboard.writeText(shareUrl);
		// Trigger a toast here later on
	}, [shareUrl]);

	const handleRegenerateToken = useCallback(() => {
		regenerateShareToken(targetId);
	}, [regenerateShareToken, targetId]);

	const handleUpdateDefaultShareRole = useCallback(
		(role: "member" | "guest") => {
			updateDefaultShareRole(targetId, role);
		},
		[updateDefaultShareRole, targetId],
	);

	return {
		pendingInvites,
		removePendingInvite,
		form,
		shareLinkConfig,
		shareUrl,
		handleAddStaged,
		handleSendAll,
		handleCancel,
		handleCopyLink,
		handleRegenerateToken,
		handleUpdateDefaultShareRole,
	};
}
