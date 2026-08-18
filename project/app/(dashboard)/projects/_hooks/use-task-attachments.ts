import * as React from "react";
import {
	createAttachmentAction,
	deleteAttachmentAction,
} from "@/lib/actions/attachment-actions";
import { reportActionError } from "@/lib/utils/toast";
import type { GridTask } from "@/types/task";

interface UseTaskAttachmentsParams {
	taskData: Partial<GridTask>;
	setTaskData: React.Dispatch<React.SetStateAction<Partial<GridTask>>>;
	isEditMode: boolean;
	selectedTaskId: string | null;
	projectId: string;
}

export function useTaskAttachments({
	taskData,
	setTaskData,
	isEditMode,
	selectedTaskId,
	projectId,
}: UseTaskAttachmentsParams) {
	// Local State & Refs
	const [isAddingLink, setIsAddingLink] = React.useState(false);
	const [linkUrl, setLinkUrl] = React.useState("");
	const fileInputRef = React.useRef<HTMLInputElement>(null);

	// Handlers
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		// File attachments are not yet persisted to a storage provider, so this
		// stays client-only (blob URLs) until one is wired up.
		const files = e.target.files;
		if (files && files.length > 0) {
			const newAttachments = Array.from(files).map((f) => ({
				id: crypto.randomUUID(),
				name: f.name,
				url: URL.createObjectURL(f),
			}));
			setTaskData((prev) => ({
				...prev,
				attachments: [...(prev.attachments || []), ...newAttachments],
			}));
		}
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const removeAttachment = (id: string) => {
		setTaskData((prev) => ({
			...prev,
			attachments: (prev.attachments || []).filter((item) => item.id !== id),
		}));
	};

	const submitLink = async () => {
		if (!linkUrl.trim()) {
			setIsAddingLink(false);
			return;
		}
		const urlStr = linkUrl.trim();
		const title = urlStr.replace(/^https?:\/\//, "").split("/")[0] || urlStr;
		const url = urlStr.startsWith("http") ? urlStr : `https://${urlStr}`;

		const tempId = crypto.randomUUID();
		const newLink = { id: tempId, title, url };
		setTaskData((prev) => ({
			...prev,
			links: [...(prev.links || []), newLink],
		}));
		setLinkUrl("");
		setIsAddingLink(false);

		if (!isEditMode || !selectedTaskId || !projectId) return;
		const result = await createAttachmentAction(selectedTaskId, projectId, {
			name: title,
			url,
			type: "link",
		});
		if (result.success && result.data) {
			const realId = result.data.id;
			setTaskData((prev) => ({
				...prev,
				links: (prev.links || []).map((l) =>
					l.id === tempId ? { ...l, id: realId } : l,
				),
			}));
		}
	};

	const removeLink = async (id: string) => {
		const previousLinks = taskData.links;
		setTaskData((prev) => ({
			...prev,
			links: (prev.links || []).filter((l) => l.id !== id),
		}));

		if (!isEditMode || !selectedTaskId || !projectId) return;
		const result = await deleteAttachmentAction(id, projectId);
		if (!result.success) {
			setTaskData((prev) => ({ ...prev, links: previousLinks }));
			reportActionError("Could not delete link", result.error);
		}
	};

	return {
		fileInputRef,
		isAddingLink,
		setIsAddingLink,
		linkUrl,
		setLinkUrl,
		handleFileChange,
		removeAttachment,
		submitLink,
		removeLink,
	};
}
