import { upload } from "@vercel/blob/client";
import * as React from "react";
import {
	createAttachmentAction,
	deleteAttachmentAction,
} from "@/lib/actions/attachment-actions";
import { reportActionError, reportActionSuccess } from "@/lib/utils/toast";
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
	const [isUploading, setIsUploading] = React.useState(false);

	/**
	 * Uploads to Vercel Blob, then stores the returned URL.
	 *
	 * This used to keep `URL.createObjectURL(file)` in memory, which meant every
	 * file attachment was gone on reload - it looked attached and never was.
	 * The upload goes browser-to-Blob so it is not capped by the Server Action
	 * body limit; the row is written afterwards by the same action links use.
	 */
	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (fileInputRef.current) fileInputRef.current.value = "";
		if (!files || files.length === 0) return;

		if (!isEditMode || !selectedTaskId || !projectId) {
			reportActionError(
				"Could not attach the file",
				"Save the task first, then add attachments to it.",
			);
			return;
		}

		setIsUploading(true);

		for (const file of Array.from(files)) {
			const tempId = crypto.randomUUID();

			/** optimistic row - the name is known immediately, so the list does not sit empty while a large file uploads. */
			setTaskData((prev) => ({
				...prev,
				attachments: [
					...(prev.attachments || []),
					{ id: tempId, name: file.name, url: "" },
				],
			}));

			try {
				const blob = await upload(file.name, file, {
					access: "public",
					handleUploadUrl: "/api/blob/upload",
				});

				const result = await createAttachmentAction(selectedTaskId, projectId, {
					name: file.name,
					url: blob.url,
					type: "file",
				});
				if (!result.success || !result.data) throw new Error(result.error);

				const saved = result.data;
				setTaskData((prev) => ({
					...prev,
					attachments: (prev.attachments || []).map((item) =>
						item.id === tempId
							? { ...item, id: saved.id, url: blob.url }
							: item,
					),
				}));
				reportActionSuccess(`Attached ${file.name}`);
			} catch (error) {
				setTaskData((prev) => ({
					...prev,
					attachments: (prev.attachments || []).filter(
						(item) => item.id !== tempId,
					),
				}));
				reportActionError("Could not attach the file", error);
			}
		}

		setIsUploading(false);
	};

	/** deletes the row too - files are stored now, so dropping it from state alone would leave it there on reload. */
	const removeAttachment = async (id: string) => {
		const previous = taskData.attachments;
		setTaskData((prev) => ({
			...prev,
			attachments: (prev.attachments || []).filter((item) => item.id !== id),
		}));

		if (!isEditMode || !selectedTaskId || !projectId) return;

		const result = await deleteAttachmentAction(id, projectId);
		if (!result.success) {
			setTaskData((prev) => ({ ...prev, attachments: previous }));
			reportActionError("Could not delete attachment", result.error);
		}
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
		isUploading,
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
