import { Archive, CheckCircle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";

interface BulkActionBarProps {
	selectedCount: number;
	onClearSelection: () => void;
	onDelete: () => void;
	onComplete?: () => void;
	onArchive?: () => void;
	deleteLabel?: string;
	archiveLabel?: string;
}

export function BulkActionBar({
	selectedCount,
	onClearSelection,
	onDelete,
	onComplete,
	onArchive,
	deleteLabel = "Delete",
	archiveLabel = "Archive",
}: BulkActionBarProps) {
	if (selectedCount === 0) return null;

	return (
		<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
			<div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-2xl border border-outline-variant/30 bg-surface-container-high px-3 py-2 shadow-lg sm:gap-4 sm:rounded-full sm:px-4">
				<div className="flex items-center gap-2 border-outline-variant/50 pr-3 sm:border-r sm:pr-4">
					<span className="bg-primary text-primary-foreground text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
						{selectedCount}
					</span>
					<span className="text-sm font-medium text-foreground">Selected</span>
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6 rounded-full text-secondary hover:text-foreground"
						onClick={onClearSelection}
					>
						<X className="w-4 h-4" />
					</Button>
				</div>
				<div className="flex items-center gap-2">
					{onArchive && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onArchive}
							className="h-8 text-primary hover:text-primary hover:bg-primary/10"
						>
							<Archive className="w-4 h-4 mr-2" />
							{archiveLabel}
						</Button>
					)}
					{onComplete && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onComplete}
							className="h-8 text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30"
						>
							<CheckCircle className="w-4 h-4 mr-2" />
							Mark as Done
						</Button>
					)}
					<Button
						variant="ghost"
						size="sm"
						onClick={onDelete}
						className="h-8 text-error hover:text-error hover:bg-error/10"
					>
						<Trash2 className="w-4 h-4 mr-2" />
						{deleteLabel}
					</Button>
				</div>
			</div>
		</div>
	);
}
