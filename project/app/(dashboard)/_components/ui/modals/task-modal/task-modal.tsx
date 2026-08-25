"use client";

import { AlertTriangle, CheckCircle, Circle } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/app/(dashboard)/_components/ui/badges/status-badge";
import { WarningModal } from "@/app/(dashboard)/_components/ui/modals/warning-modal";
import { Button } from "@/components/ui/buttons/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { TaskMobilePane, TaskPanelTab } from "@/lib/types/task";
import { cn } from "@/lib/utils";
import { useTaskModal } from "../../../../projects/_hooks/use-task-modal";
import { TaskAssignees } from "./task-assignees";
import { TaskAttachmentsLinks } from "./task-attachments-links";
import { TaskChecklist } from "./task-checklist";
import { TaskDescription } from "./task-description";
import { TaskMobileTabs } from "./task-mobile-tabs";
import { TaskModalToolbar } from "./task-modal-toolbar";
import { TaskPropertiesGrid } from "./task-properties-grid";
import { TaskSidePanel } from "./task-side-panel";

export function TaskModal() {
	const {
		projectId,
		selectedTaskId,
		isTaskModalOpen,
		closeTaskModal,
		isEditMode,
		isOverdue,
		displayStatus,
		handleStatusChange,
		taskData,
		setTaskData,
		handleChange,
		handleCreate,
		scheduleError,
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
		deleteWarning,
		confirmDeleteWarning,
		closeDeleteWarning,
		isCommentsOpen,
		toggleComments,
		handleAction,
	} = useTaskModal();

	/**
	 * pane state - `mobilePane` decides which single panel shows below `md`;
	 * `panelTab` is the comments/activity choice shared by the desktop tab row
	 * and the mobile strip, so switching on one width does not reset the other.
	 */
	const [mobilePane, setMobilePane] = useState<TaskMobilePane>("details");
	const [panelTab, setPanelTab] = useState<TaskPanelTab>("comments");

	const showPanelOnMobile = isEditMode && mobilePane !== "details";

	const handlePaneChange = (pane: TaskMobilePane) => {
		setMobilePane(pane);
		if (pane !== "details") setPanelTab(pane);
	};

	return (
		<Dialog
			open={isTaskModalOpen}
			onOpenChange={(open) => !open && closeTaskModal()}
		>
			<DialogContent
				showCloseButton={false}
				className="flex h-[92dvh] max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-none flex-col overflow-hidden bg-surface p-0 gap-0 sm:w-full sm:max-w-5xl md:h-[90vh] md:max-h-[90vh] md:flex-row"
			>
				{/* left details pane - the only pane below md unless a tab swaps it out */}
				<div
					className={cn(
						"flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-outline-variant md:flex md:border-r",
						showPanelOnMobile && "hidden",
					)}
				>
					<DialogHeader className="shrink-0 space-y-0 border-b border-outline-variant bg-surface-container-lowest px-3 py-3 sm:px-6 sm:py-4">
						<div className="flex items-start gap-2 sm:gap-3">
							<button
								type="button"
								onClick={toggleTaskCompletion}
								className="mt-1.5 shrink-0 text-secondary transition-colors hover:text-primary focus:outline-none"
								aria-label="Toggle task completion"
							>
								{taskData.isCompleted ? (
									<CheckCircle className="size-5 text-green-500 sm:size-6" />
								) : (
									<Circle className="size-5 sm:size-6" />
								)}
							</button>

							{/*
							 * title column - the status badge sits under the name rather than
							 * beside it. Three items on one row is what pushed the toolbar
							 * over the badge at 375px.
							 */}
							<div className="flex min-w-0 flex-1 flex-col gap-1">
								{/* accessible name - the dialog needs a title, but the visible one is an editable field, and an h2 that is really a text input reads wrong to a screen reader. */}
								<DialogTitle className="sr-only">
									{taskData.name || "Task"}
								</DialogTitle>
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
									className="h-auto border-none bg-transparent px-0 text-base font-semibold shadow-none focus-visible:ring-0 sm:text-lg md:text-xl"
								/>
								{isEditMode && displayStatus && (
									<div className="self-start">
										<StatusBadge status={displayStatus} />
									</div>
								)}
							</div>

							<TaskModalToolbar
								isCommentsOpen={isCommentsOpen}
								toggleComments={toggleComments}
								isEditMode={isEditMode}
								isCompleted={taskData.isCompleted}
								closeTaskModal={closeTaskModal}
								onAction={handleAction}
							/>
						</div>

						{/* overdue warning - persists regardless of status changes and is only cleared by updating the due date. */}
						{isOverdue && (
							<div className="mt-3 flex items-start gap-2 rounded-md border border-error/20 bg-error/10 px-3 py-2">
								<AlertTriangle className="mt-0.5 size-4 shrink-0 text-error" />
								<p className="text-xs text-error sm:text-sm">
									This task is past its due date. Update the due date to clear
									this notice.
								</p>
							</div>
						)}
					</DialogHeader>

					<div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-3 sm:space-y-8 sm:p-6">
						<TaskPropertiesGrid
							isCommentsOpen={isCommentsOpen}
							taskData={taskData}
							handleChange={handleChange}
							scheduleError={scheduleError}
							displayStatus={displayStatus}
							onStatusChange={handleStatusChange}
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

					{/* creation action footer */}
					{!isEditMode && (
						<div className="flex shrink-0 justify-end gap-2 border-t border-outline-variant bg-surface-container-lowest p-3 sm:p-4">
							<Button type="button" variant="outline" onClick={closeTaskModal}>
								Cancel
							</Button>
							<Button type="button" onClick={handleCreate}>
								Create Task
							</Button>
						</div>
					)}
				</div>

				{/* right comments pane - a collapsible column on desktop, a swapped-in panel on mobile */}
				{isEditMode && (
					<div
						className={cn(
							"min-h-0 min-w-0 flex-1 flex-col border-outline-variant bg-surface-container-lowest md:h-full md:flex-none md:shrink-0 md:border-l md:transition-all md:duration-300 md:ease-in-out md:overflow-hidden",
							showPanelOnMobile ? "flex" : "hidden md:flex",
							isCommentsOpen
								? "md:w-80 md:opacity-100"
								: "md:w-0 md:border-none md:opacity-0",
						)}
					>
						<div className="flex h-full min-h-0 w-full min-w-0 flex-col md:w-80">
							<TaskSidePanel
								taskId={selectedTaskId ?? undefined}
								projectId={projectId}
								isOpen={isCommentsOpen || showPanelOnMobile}
								activeTab={panelTab}
								onTabChange={(tab) => {
									setPanelTab(tab);
									setMobilePane((current) =>
										current === "details" ? current : tab,
									);
								}}
							/>
						</div>
					</div>
				)}

				{/* bottom strip - mobile only, and only once the task exists to have comments */}
				{isEditMode && (
					<TaskMobileTabs
						activePane={mobilePane}
						onPaneChange={handlePaneChange}
					/>
				)}

				<WarningModal
					isOpen={deleteWarning.isOpen}
					onClose={closeDeleteWarning}
					onConfirm={confirmDeleteWarning}
					variant="danger"
					title="Delete task with unfinished checklist items?"
					message={`"${deleteWarning.taskName}" still has unchecked checklist items. Deleting it will also remove those items.`}
					confirmText="Delete"
				/>
			</DialogContent>
		</Dialog>
	);
}
