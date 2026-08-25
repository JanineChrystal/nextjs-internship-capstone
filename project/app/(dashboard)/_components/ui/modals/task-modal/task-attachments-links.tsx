import { Link as LinkIcon, Paperclip, Plus, Trash2 } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/buttons/button";
import { Input } from "@/components/ui/input";
import type { GridTask } from "@/types/task";

interface TaskAttachmentsLinksProps {
	taskData: Partial<GridTask>;
	fileInputRef: React.RefObject<HTMLInputElement | null>;
	/** upload in flight - the file goes to Blob before the row exists, so the button has to say so. */
	isUploading?: boolean;
	handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	removeAttachment: (id: string) => void;
	isAddingLink: boolean;
	setIsAddingLink: (value: boolean) => void;
	linkUrl: string;
	setLinkUrl: (value: string) => void;
	submitLink: () => void;
	removeLink: (id: string) => void;
}

export function TaskAttachmentsLinks({
	taskData,
	fileInputRef,
	isUploading = false,
	handleFileChange,
	removeAttachment,
	isAddingLink,
	setIsAddingLink,
	linkUrl,
	setLinkUrl,
	submitLink,
	removeLink,
}: TaskAttachmentsLinksProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-2">
			<div className="space-y-2">
				<span className="block text-xs font-medium text-secondary uppercase tracking-wider">
					Attachments
				</span>
				<div className="flex flex-col gap-2">
					{(taskData.attachments || []).map(
						(attachment: { id: string; name: string; url: string }) => (
							<div
								key={attachment.id}
								className="flex items-center justify-between group rounded-md border border-outline-variant p-2 hover:bg-surface-variant transition-colors"
							>
								<div className="flex items-center gap-2 overflow-hidden">
									<Paperclip className="h-4 w-4 text-secondary shrink-0" />
									<a
										href={attachment.url}
										target="_blank"
										rel="noreferrer"
										className="text-sm text-primary hover:underline truncate"
									>
										{attachment.name}
									</a>
								</div>
								<Button
									variant="ghost"
									size="icon-sm"
									className="h-6 w-6 opacity-0 group-hover:opacity-100 text-secondary hover:text-error hover:bg-error/10"
									onClick={() => removeAttachment(attachment.id)}
								>
									<Trash2 className="h-3 w-3" />
								</Button>
							</div>
						),
					)}
					<input
						type="file"
						multiple
						className="hidden"
						ref={fileInputRef}
						onChange={handleFileChange}
					/>
					<Button
						variant="outline"
						disabled={isUploading}
						className="w-full justify-start text-secondary border-dashed"
						onClick={() => fileInputRef.current?.click()}
					>
						<Plus className="h-4 w-4 mr-2" />
						{isUploading ? "Uploading..." : "Add attachment"}
					</Button>
				</div>
			</div>
			<div className="space-y-2">
				<span className="block text-xs font-medium text-secondary uppercase tracking-wider">
					Links
				</span>
				<div className="flex flex-col gap-2">
					{(taskData.links || []).map(
						(link: { id: string; title: string; url: string }) => (
							<div
								key={link.id}
								className="flex items-center justify-between group rounded-md border border-outline-variant p-2 hover:bg-surface-variant transition-colors"
							>
								<div className="flex items-center gap-2 overflow-hidden">
									<LinkIcon className="h-4 w-4 text-secondary shrink-0" />
									<a
										href={link.url}
										target="_blank"
										rel="noreferrer"
										className="text-sm text-primary hover:underline truncate"
									>
										{link.title}
									</a>
								</div>
								<Button
									variant="ghost"
									size="icon-sm"
									className="h-6 w-6 opacity-0 group-hover:opacity-100 text-secondary hover:text-error hover:bg-error/10"
									onClick={() => removeLink(link.id)}
								>
									<Trash2 className="h-3 w-3" />
								</Button>
							</div>
						),
					)}
					{isAddingLink ? (
						<Input
							autoFocus
							placeholder="Paste link and press Enter"
							value={linkUrl}
							onChange={(e) => setLinkUrl(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") submitLink();
								if (e.key === "Escape") setIsAddingLink(false);
							}}
							onBlur={submitLink}
							className="h-9.5 text-sm"
						/>
					) : (
						<Button
							variant="outline"
							className="w-full justify-start text-secondary border-dashed"
							onClick={() => setIsAddingLink(true)}
						>
							<Plus className="h-4 w-4 mr-2" />
							Add link
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
