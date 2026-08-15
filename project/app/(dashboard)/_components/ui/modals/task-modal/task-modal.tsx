"use client";

import { CheckCircle, Circle } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTaskModal } from "../../../../projects/_hooks/use-task-modal";
import { TaskAssignees } from "./task-assignees";
import { TaskAttachmentsLinks } from "./task-attachments-links";
import { TaskChecklist } from "./task-checklist";
import { TaskComments } from "./task-comments";
import { TaskDescription } from "./task-description";
import { TaskModalToolbar } from "./task-modal-toolbar";
import { TaskPropertiesGrid } from "./task-properties-grid";

export function TaskModal() {
	const {
		selectedTaskId,
		isTaskModalOpen,
		closeTaskModal,
		isEditMode,
		taskData,
		setTaskData,
		handleChange,
		handleCreate,
		addChecklistItem,
		updateChecklistItem,
		commitChecklistItem,
		toggleChecklistItem,
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
		isCommentsOpen,
		toggleComments,
		handleAction,
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
				<TaskModalToolbar
					isCommentsOpen={isCommentsOpen}
					toggleComments={toggleComments}
					isEditMode={isEditMode}
					isCompleted={taskData.isCompleted}
					closeTaskModal={closeTaskModal}
					onAction={handleAction}
				/>

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
						<TaskPropertiesGrid
							isCommentsOpen={isCommentsOpen}
							taskData={taskData}
							handleChange={handleChange}
						/>

						<TaskAssignees taskData={taskData} handleChange={handleChange} />

						<TaskAttachmentsLinks
							taskData={taskData}
							fileInputRef={fileInputRef}
							handleFileChange={handleFileChange}
							removeAttachment={removeAttachment}
							isAddingLink={isAddingLink}
							setIsAddingLink={setIsAddingLink}
							linkUrl={linkUrl}
							setLinkUrl={setLinkUrl}
							submitLink={submitLink}
							removeLink={removeLink}
						/>

						<TaskChecklist
							taskData={taskData}
							addChecklistItem={addChecklistItem}
							updateChecklistItem={updateChecklistItem}
							commitChecklistItem={commitChecklistItem}
							toggleChecklistItem={toggleChecklistItem}
							removeChecklistItem={removeChecklistItem}
						/>

						<TaskDescription
							taskData={taskData}
							setTaskData={setTaskData}
							handleChange={handleChange}
							isEditMode={isEditMode}
						/>
					</div>

					{/* Create Action Footer */}
					{!isEditMode && (
						<div className="p-4 border-t border-outline-variant bg-surface-container-lowest mt-auto sticky bottom-0 z-10 flex justify-end">
							<Button
								type="button"
								variant="outline"
								className="mr-2"
								onClick={closeTaskModal}
							>
								Cancel
							</Button>
							<Button type="button" onClick={handleCreate}>
								Create Task
							</Button>
						</div>
					)}
				</div>

				{/* Right Pane - Comments */}
				{isEditMode && (
					<div
						className={`w-full h-auto md:h-full border-t md:border-t-0 md:border-l border-outline-variant bg-surface-container-lowest flex flex-col md:transition-all md:duration-300 md:ease-in-out md:overflow-hidden ${
							isCommentsOpen
								? "md:w-80 md:opacity-100"
								: "md:w-0 md:opacity-0 md:border-none"
						}`}
					>
						<div className="w-full md:w-80 h-full flex flex-col">
							<TaskComments
								taskId={selectedTaskId ?? undefined}
								isOpen={isCommentsOpen}
							/>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
