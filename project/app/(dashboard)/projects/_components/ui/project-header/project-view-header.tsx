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
			className="flex items-center gap-2 text-secondary hover:bg-surface-variant font-label-md"
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
			{/* Status Badge */}
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

			{/* Priority Badge */}
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

			{/* Category Badge */}
			{project.category && (
				<div className="flex items-center gap-2 px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-label-sm font-medium transition-all">
					{project.category}
				</div>
			)}

			{/* Start Date */}
			{project.startDate && (
				<div className="flex items-center gap-2 text-secondary text-label-sm px-2 py-1 rounded-md transition-all">
					<Calendar size={14} className="shrink-0" />
					{project.startDate}
				</div>
			)}

			{project.startDate && project.dueDate && (
				<span className="text-outline-variant hidden sm:inline">•</span>
			)}

			{/* Due Date */}
			{project.dueDate && (
				<div className="flex items-center gap-2 text-secondary text-label-sm px-2 py-1 rounded-md transition-all">
					<Calendar size={14} className="shrink-0" />
					{project.dueDate}
				</div>
			)}

			<div className="ml-auto">{editButton}</div>
		</PageHeader>
	);
}
