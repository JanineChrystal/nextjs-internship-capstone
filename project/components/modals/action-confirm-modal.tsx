import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ActionConfirmModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	description: string;
	confirmText?: string;
	cancelText?: string;
	isDestructive?: boolean;
}

export function ActionConfirmModal({
	isOpen,
	onClose,
	onConfirm,
	title,
	description,
	confirmText = "Confirm",
	cancelText = "Cancel",
	isDestructive = false,
}: ActionConfirmModalProps) {
	return (
		<AlertDialog open={isOpen} onOpenChange={onClose}>
			<AlertDialogContent className="bg-surface border-surface-variant max-w-md">
				<AlertDialogHeader>
					<AlertDialogTitle className="text-on-surface font-h3 text-h3">
						{title}
					</AlertDialogTitle>
					<AlertDialogDescription className="text-secondary font-body-sm text-body-sm">
						{description}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="mt-6">
					<AlertDialogCancel
						onClick={onClose}
						className="font-label-md text-label-md border-outline-variant text-on-surface hover:bg-surface-container"
					>
						{cancelText}
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={(e) => {
							e.preventDefault();
							onConfirm();
							onClose();
						}}
						className={cn(
							"font-label-md text-label-md",
							isDestructive
								? "bg-error text-on-error hover:bg-error/90"
								: "bg-primary text-on-primary hover:bg-primary/90",
						)}
					>
						{confirmText}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
