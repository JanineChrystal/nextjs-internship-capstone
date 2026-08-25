"use client";

import { Calendar, Edit2, Flag } from "lucide-react";
import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";
import { TASK_PRIORITY_BADGE_STYLES } from "@/app/(dashboard)/_constants/task";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/buttons/button";
import type { EditProjectFormValues } from "@/lib/validations/project-schema";

interface ProjectViewHeaderProps {
	project: EditProjectFormValues & { priority?: string };
	onEdit: () => void;
}

// iso formatter - converts UTC ISO strings into a human-readable date and time format.
function formatDateDisplay(isoString: string): string {
	const [datePart, timePart] = isoString.split("T");
	const [year, month, day] = (datePart ?? "").split("-").map(Number);
	const [hours = 0, minutes = 0] = (timePart ?? "").split(":").map(Number);
	const monthNames = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];
	const amPm = hours >= 12 ? "PM" : "AM";
	const displayHours = hours % 12 || 12;
	return `${monthNames[(month ?? 1) - 1]} ${day}, ${year}, ${String(displayHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${amPm}`;
}

export function ProjectViewHeader({ project, onEdit }: ProjectViewHeaderProps) {
	const projectBreadcrumbs = (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				<BreadcrumbItem>
					<BreadcrumbPage>{project.title}</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	);

	const editButton = (
		<Button
			type="button"
			variant="ghost"
			onClick={onEdit}
			className="flex items-center gap-2 text-secondary hover:bg-surface-variant"
		>
			<Edit2 size={16} />
			Edit
		</Button>
	);

	return (
		<PageHeader
			breadcrumbs={projectBreadcrumbs}
			title={project.title}
			description={project.description || "No description provided."}
			className="transition-all"
		>
			{/* status badge - displays the current workflow state with a color-coded dot. */}
			{project.status && (
				<div className="flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-full text-label-sm font-medium capitalize transition-all">
					<span
						className={`w-2 h-2 rounded-full shrink-0 ${
							project.status === "active" ? "bg-green-500" : "bg-secondary"
						}`}
					/>
					{project.status}
				</div>
			)}

			{/* priority badge - shows the assigned priority level with matching styling. */}
			{project.priority && (
				<div
					className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-medium capitalize border transition-all ${
						TASK_PRIORITY_BADGE_STYLES[project.priority.toLowerCase()] ||
						TASK_PRIORITY_BADGE_STYLES.low
					}`}
				>
					<Flag size={12} className="shrink-0" />
					{project.priority} Priority
				</div>
			)}

			{/* category badge - indicates the assigned category classification. */}
			{project.category && (
				<div className="flex items-center gap-2 px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-label-sm font-medium transition-all">
					{project.category}
				</div>
			)}

			{/*
			 * labelled dates - two bare dates separated by a dot gave no way to tell
			 * which was the start and which the deadline, and the order alone is not
			 * a label. The word is dimmer than the date so the date still reads first.
			 */}
			{project.startDate && (
				<div className="flex items-center gap-1.5 text-secondary text-label-sm px-2 py-1 rounded-md transition-all">
					<Calendar size={14} className="shrink-0" />
					<span className="text-on-surface-variant/70">Start:</span>
					<span className="font-medium">
						{formatDateDisplay(project.startDate)}
					</span>
				</div>
			)}

			{project.startDate && project.dueDate && (
				<span className="text-outline-variant hidden sm:inline">•</span>
			)}

			{project.dueDate && (
				<div className="flex items-center gap-1.5 text-secondary text-label-sm px-2 py-1 rounded-md transition-all">
					<Calendar size={14} className="shrink-0" />
					<span className="text-on-surface-variant/70">Due:</span>
					<span className="font-medium">
						{formatDateDisplay(project.dueDate)}
					</span>
				</div>
			)}

			<div className="ml-auto">{editButton}</div>
		</PageHeader>
	);
}
