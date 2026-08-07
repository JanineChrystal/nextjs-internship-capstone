"use client";

import {
	CheckCircle,
	Circle,
	Copy,
	Link as LinkIcon,
	MoreHorizontal,
	PanelRightClose,
	PanelRightOpen,
	Paperclip,
	Plus,
	Trash2,
	X,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/buttons/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate } from "@/lib/utils/date";
import {
	TASK_BOARDS,
	TASK_PRIORITIES,
	TASK_STATUSES,
	TASK_TAGS,
} from "@/lib/validations/task-schema";
import type {
	Assignee,
	TaskBoard,
	TaskPriority,
	TaskStatus,
	TaskTag,
} from "@/types/task";
import { useTaskModal } from "../../../../_hooks/use-task-modal";
import { AssigneeSelector } from "../../assignee-selector";
import { BoardBadge } from "../../badges/board-badge";
import { PriorityBadge } from "../../badges/priority-badge";
import { StatusBadge } from "../../badges/status-badge";
import { TagBadge } from "../../badges/tag-badge";
import { TaskComments } from "./task-comments";

export function TaskModal() {
	const {
		isTaskModalOpen,
		closeTaskModal,
		isEditMode,
		taskData,
		setTaskData,
		handleChange,
		handleCreate,
		addChecklistItem,
		updateChecklistItem,
		removeChecklistItem,
		toggleTaskCompletion,
		fileInputRef,
		isAddingLink,
		setIsAddingLink,
		linkUrl,
		setLinkUrl,
		handleFileChange,
		removeAttachment,
		submitLink,
		removeLink,
		handleDuplicate,
		handleDelete,
		isCommentsOpen,
		toggleComments,
	} = useTaskModal();

	return (
		<Dialog
			open={isTaskModalOpen}
			onOpenChange={(open) => !open && closeTaskModal()}
		>
			<DialogContent
				showCloseButton={false}
				className="sm:max-w-5xl p-0 gap-0 overflow-hidden bg-surface flex flex-col md:flex-row h-fit max-h-[90vh] min-h-150 overflow-y-auto md:overflow-hidden"
			>
				{/* Top Right Floating Toolbar */}
				<div className="absolute top-2 right-2 z-50 flex items-center gap-1 backdrop-blur-sm rounded-md p-0.5 md:border-none md:shadow-none md:bg-transparent">
					<Button
						variant="ghost"
						size="icon-sm"
						className="hidden md:flex h-8 w-8 text-secondary hover:text-foreground"
						onClick={toggleComments}
						aria-label={isCommentsOpen ? "Close comments" : "Open comments"}
					>
						{isCommentsOpen ? (
							<PanelRightClose className="h-4 w-4" />
						) : (
							<PanelRightOpen className="h-4 w-4" />
						)}
					</Button>
					{isEditMode && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									className="h-8 w-8 text-secondary"
								>
									<MoreHorizontal className="h-4 w-4" />
									<span className="sr-only">More options</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								<DropdownMenuItem
									onClick={toggleTaskCompletion}
									className="text-green-600 dark:text-green-400"
								>
									<CheckCircle className="h-4 w-4 mr-2" />
									{taskData.isCompleted ? "Mark as not done" : "Mark as done"}
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleDuplicate}>
									<Copy className="h-4 w-4 mr-2" />
									Duplicate task
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={handleDelete}
									className="text-error hover:text-error hover:bg-error/10 focus:text-error focus:bg-error/10"
								>
									<Trash2 className="h-4 w-4 mr-2" />
									Delete task
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
					<Button
						variant="ghost"
						size="icon-sm"
						className="h-8 w-8 text-secondary hover:text-foreground"
						onClick={closeTaskModal}
					>
						<X className="h-4 w-4" />
						<span className="sr-only">Close</span>
					</Button>
				</div>

				{/* Left Pane - Details */}
				<div className="flex-1 flex flex-col overflow-y-auto border-r border-outline-variant">
					<DialogHeader className="px-6 py-4 border-b border-outline-variant bg-surface-container-lowest sticky top-0 z-10">
						<DialogTitle className="flex items-center gap-3">
							<button
								type="button"
								onClick={toggleTaskCompletion}
								className="text-secondary hover:text-primary transition-colors focus:outline-none"
								aria-label="Toggle task completion"
							>
								{taskData.isCompleted ? (
									<CheckCircle className="h-6 w-6 text-green-500" />
								) : (
									<Circle className="h-6 w-6" />
								)}
							</button>
							<Input
								value={taskData.name}
								onChange={(e) =>
									setTaskData({ ...taskData, name: e.target.value })
								}
								onBlur={() =>
									isEditMode && handleChange({ name: taskData.name })
								}
								placeholder="Task name"
								aria-label="Task name"
								className="text-xl font-semibold border-none shadow-none focus-visible:ring-0 px-0 h-auto bg-transparent flex-1"
							/>
						</DialogTitle>
					</DialogHeader>

					<div className="p-6 space-y-8">
						{/* Properties Grid - Dynamic Columns */}
						<div
							className={`grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 ${
								isCommentsOpen ? "md:grid-cols-3" : "md:grid-cols-6"
							}`}
						>
							{/* Row 1 & 2 Dynamically */}
							<div className="space-y-1">
								<span className="block text-xs font-medium text-secondary uppercase tracking-wider">
									Category
								</span>
								<DropdownMenu>
									<DropdownMenuTrigger className="w-full focus:outline-none flex items-center justify-between p-2 rounded-md border border-outline-variant hover:bg-surface-variant transition-colors">
										<TagBadge tag={taskData.tag as TaskTag} />
									</DropdownMenuTrigger>
									<DropdownMenuContent align="start">
										{TASK_TAGS.map((t) => (
											<DropdownMenuItem
												key={t}
												onClick={() => handleChange({ tag: t })}
											>
												{t}
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
							<div className="space-y-1">
								<span className="block text-xs font-medium text-secondary uppercase tracking-wider">
									Status
								</span>
								<DropdownMenu>
									<DropdownMenuTrigger className="w-full focus:outline-none flex items-center justify-between p-2 rounded-md border border-outline-variant hover:bg-surface-variant transition-colors">
										<StatusBadge status={taskData.status as TaskStatus} />
									</DropdownMenuTrigger>
									<DropdownMenuContent align="start">
										{TASK_STATUSES.map((s) => (
											<DropdownMenuItem
												key={s}
												onClick={() => handleChange({ status: s })}
											>
												{s}
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
							<div className="space-y-1">
								<span className="block text-xs font-medium text-secondary uppercase tracking-wider">
									Priority
								</span>
								<DropdownMenu>
									<DropdownMenuTrigger className="w-full focus:outline-none flex items-center justify-between p-2 rounded-md border border-outline-variant hover:bg-surface-variant transition-colors">
										<PriorityBadge
											priority={taskData.priority as TaskPriority}
										/>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="start">
										{TASK_PRIORITIES.map((p) => (
											<DropdownMenuItem
												key={p}
												onClick={() => handleChange({ priority: p })}
											>
												{p}
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
							<div className="space-y-1">
								<span className="block text-xs font-medium text-secondary uppercase tracking-wider">
									Board
								</span>
								<DropdownMenu>
									<DropdownMenuTrigger className="w-full focus:outline-none flex items-center justify-between p-2 rounded-md border border-outline-variant hover:bg-surface-variant transition-colors">
										<BoardBadge board={taskData.board as TaskBoard} />
									</DropdownMenuTrigger>
									<DropdownMenuContent align="start">
										{TASK_BOARDS.map((b) => (
											<DropdownMenuItem
												key={b}
												onClick={() => handleChange({ board: b })}
											>
												{b}
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>

							<div className="space-y-1">
								<span className="block text-xs font-medium text-secondary uppercase tracking-wider">
									Start Date
								</span>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className="w-full justify-start font-normal h-9.5 px-2 py-2 border-outline-variant"
										>
											{formatDate(taskData.startDate)}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={
												taskData.startDate && taskData.startDate !== "--"
													? new Date(taskData.startDate)
													: undefined
											}
											onSelect={(date) =>
												date && handleChange({ startDate: date.toISOString() })
											}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
							</div>
							<div className="space-y-1">
								<span className="block text-xs font-medium text-secondary uppercase tracking-wider">
									Due Date
								</span>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className="w-full justify-start font-normal h-9.5 px-2 py-2 border-outline-variant"
										>
											{formatDate(taskData.dueDate)}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={
												taskData.dueDate && taskData.dueDate !== "--"
													? new Date(taskData.dueDate)
													: undefined
											}
											onSelect={(date) =>
												date && handleChange({ dueDate: date.toISOString() })
											}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
							</div>
						</div>

						{/* Assignees Section */}
						<div className="space-y-2 pt-2">
							<span className="block text-xs font-medium text-secondary uppercase tracking-wider">
								Assignees
							</span>
							<div className="flex items-center gap-2 flex-wrap">
								<AssigneeSelector
									assignees={taskData.assignees || []}
									onAssigneesChange={(newAssignees) => {
										setTaskData({ ...taskData, assignees: newAssignees });
										if (isEditMode) handleChange({ assignees: newAssignees });
									}}
								/>

								{(taskData.assignees || []).map((assignee: Assignee) => (
									<div
										key={assignee.name}
										className="flex items-center gap-2 p-1.5 px-3 rounded-full border border-outline-variant bg-surface-container-lowest"
									>
										<Image
											src={assignee.avatarUrl}
											alt="Avatar"
											width={20}
											height={20}
											className="rounded-full bg-surface-variant shrink-0"
										/>
										<span className="text-sm font-medium">{assignee.name}</span>
									</div>
								))}
							</div>
						</div>

						{/* Attachments and Links Grid */}
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
										className="w-full justify-start text-secondary border-dashed"
										onClick={() => fileInputRef.current?.click()}
									>
										<Plus className="h-4 w-4 mr-2" />
										Add attachment
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

						{/* Checklist Section */}
						<div className="space-y-3 pt-4 border-t border-outline-variant/50">
							<div className="flex items-center justify-between">
								<h3 className="text-sm font-semibold text-foreground">
									Checklist
								</h3>
								<span className="text-xs text-secondary">
									{
										(taskData.checklist || []).filter(
											(i: { completed: boolean }) => i.completed,
										).length
									}
									/{(taskData.checklist || []).length}
								</span>
							</div>
							<div className="space-y-2">
								{(taskData.checklist || []).map(
									(item: { id: string; title: string; completed: boolean }) => (
										<div
											key={item.id}
											className="flex items-center gap-3 group"
										>
											<button
												type="button"
												onClick={() =>
													updateChecklistItem(item.id, {
														completed: !item.completed,
													})
												}
												className="text-secondary hover:text-primary transition-colors focus:outline-none"
												aria-label="Toggle checklist item"
											>
												{item.completed ? (
													<CheckCircle className="h-5 w-5 text-primary" />
												) : (
													<Circle className="h-5 w-5" />
												)}
											</button>
											<Input
												value={item.title}
												onChange={(e) => {
													const newChecklist = (taskData.checklist || []).map(
														(i: {
															id: string;
															title: string;
															completed: boolean;
														}) =>
															i.id === item.id
																? { ...i, title: e.target.value }
																: i,
													);
													setTaskData({ ...taskData, checklist: newChecklist });
												}}
												onBlur={() =>
													isEditMode &&
													handleChange({ checklist: taskData.checklist })
												}
												className={`flex-1 border-none bg-transparent shadow-none px-0 focus-visible:ring-0 ${item.completed ? "line-through text-secondary" : ""}`}
												placeholder="Checklist item..."
												aria-label="Checklist item"
											/>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => removeChecklistItem(item.id)}
												className="opacity-0 group-hover:opacity-100 h-8 w-8 text-error hover:bg-error/10 transition-opacity"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									),
								)}
								<Button
									variant="ghost"
									size="sm"
									className="text-primary hover:text-primary/80 hover:bg-primary/10 px-2 -ml-2"
									onClick={addChecklistItem}
								>
									<Plus className="h-4 w-4 mr-1" />
									Add Item
								</Button>
							</div>
						</div>

						{/* Notes / Description Section */}
						<div className="space-y-3 pt-4 border-t border-outline-variant/50">
							<h3 className="text-sm font-semibold text-foreground">Notes</h3>
							<textarea
								value={taskData.description || ""}
								onChange={(e) =>
									setTaskData({ ...taskData, description: e.target.value })
								}
								onBlur={() =>
									isEditMode &&
									handleChange({ description: taskData.description })
								}
								placeholder="Add detailed task description or notes here..."
								aria-label="Task description"
								className="w-full min-h-30 p-3 rounded-lg border border-outline-variant bg-transparent resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
							/>
						</div>
					</div>

					{/* Create Action Footer */}
					{!isEditMode && (
						<div className="p-4 border-t border-outline-variant bg-surface-container-lowest mt-auto sticky bottom-0 z-10 flex justify-end">
							<Button
								variant="outline"
								className="mr-2"
								onClick={closeTaskModal}
							>
								Cancel
							</Button>
							<Button onClick={handleCreate} disabled={!taskData.name}>
								Create Task
							</Button>
						</div>
					)}
				</div>

				{/* Right Pane - Comments */}
				<div
					className={`w-full h-auto md:h-full border-t md:border-t-0 md:border-l border-outline-variant bg-surface-container-lowest flex flex-col md:transition-all md:duration-300 md:ease-in-out md:overflow-hidden ${
						isCommentsOpen
							? "md:w-80 md:opacity-100"
							: "md:w-0 md:opacity-0 md:border-none"
					}`}
				>
					<div className="w-full md:w-80 h-full flex flex-col">
						<TaskComments />
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
