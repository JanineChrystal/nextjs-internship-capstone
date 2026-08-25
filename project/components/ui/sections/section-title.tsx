import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionTitleProps {
	title: ReactNode;
	description?: ReactNode;
	className?: string;
	titleClassName?: string;
	descriptionClassName?: string;
}

export function SectionTitle({
	title,
	description,
	className,
	titleClassName,
	descriptionClassName,
}: SectionTitleProps) {
	return (
		<div className={cn("flex flex-col gap-1", className)}>
			{typeof title === "string" ? (
				<h2
					className={cn(
						"text-xl font-bold text-on-surface flex items-center gap-2",
						titleClassName,
					)}
				>
					{title}
				</h2>
			) : (
				<div
					className={cn(
						"text-xl font-bold text-on-surface flex items-center gap-2",
						titleClassName,
					)}
				>
					{title}
				</div>
			)}
			{description && (
				<p className={cn("text-sm text-secondary", descriptionClassName)}>
					{description}
				</p>
			)}
		</div>
	);
}
