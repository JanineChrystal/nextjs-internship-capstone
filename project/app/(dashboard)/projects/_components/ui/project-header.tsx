"use client";

import { Check, Edit2, X } from "lucide-react";
import { useEffect } from "react";
import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";
import { Button } from "@/components/ui/buttons/button";
import { useEditProject } from "../../_hooks/use-edit-project";

interface ProjectHeaderProps {
	projectId: string;
	title: string;
	description?: string;
}

export function ProjectHeader({
	projectId,
	title: initialTitle,
	description: initialDescription = "",
}: ProjectHeaderProps) {
	const { isEditing, setIsEditing, form, onSubmit, onCancel } = useEditProject(
		projectId,
		{ title: initialTitle, description: initialDescription },
	);
	useEffect(() => {
		if (isEditing) {
			form.setFocus("title");
		}
	}, [isEditing, form]);

	const titleContent = isEditing ? (
		<div className="flex items-center gap-3 w-full max-w-xl">
			<input
				{...form.register("title")}
				className="w-full bg-transparent border-b border-primary focus:outline-none pb-1 font-bold text-5xl"
			/>
			<Button
				type="submit"
				size="sm"
				className="w-8 h-8 p-0 shrink-0 rounded-md"
			>
				<Check className="w-4 h-4" />
			</Button>
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={onCancel}
				className="w-8 h-8 p-0 shrink-0 rounded-md"
			>
				<X className="w-4 h-4" />
			</Button>
		</div>
	) : (
		<>
			{initialTitle}
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onClick={() => setIsEditing(true)}
				className="opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
				aria-label="Edit project details"
			>
				<Edit2 className="w-5 h-5 text-muted-foreground" />
			</Button>
		</>
	);

	const descriptionContent = isEditing ? (
		<div className="w-full">
			<textarea
				{...form.register("description")}
				className="w-full bg-transparent border border-input rounded-md p-3 focus:outline-none focus:border-primary resize-y text-base"
				rows={3}
			/>
			{form.formState.errors.title && (
				<span className="text-sm text-destructive block mt-1">
					{form.formState.errors.title.message}
				</span>
			)}
		</div>
	) : (
		<span>{initialDescription || "No description provided."}</span>
	);

	return (
		<form onSubmit={onSubmit} className="w-full">
			<PageHeader title={titleContent} description={descriptionContent} />
		</form>
	);
}
