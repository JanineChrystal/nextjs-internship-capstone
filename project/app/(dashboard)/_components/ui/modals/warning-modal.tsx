"use client";

import { AlertTriangle, Info, Trash2 } from "lucide-react";
import { BaseModal } from "@/components/modals/base-modal";
import { Button } from "@/components/ui/buttons/button";

interface WarningModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	variant?: "danger" | "warning" | "info";
}

export function WarningModal({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
	confirmText = "Confirm",
	cancelText = "Cancel",
	variant = "danger",
}: WarningModalProps) {
	const getIcon = () => {
		switch (variant) {
			case "danger":
				return <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />;
			case "warning":
				return (
					<AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
				);
			case "info":
				return <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />;
		}
	};

	const getConfirmVariant = () => {
		switch (variant) {
			case "danger":
				return "destructive";
			case "warning":
				return "default";
			case "info":
				return "default";
		}
	};

	return (
		<BaseModal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
			<div className="p-6 space-y-6">
				<div className="flex items-start gap-4">
					<div className="p-3 bg-muted rounded-full shrink-0">{getIcon()}</div>
					<div className="space-y-1">
						<p className="text-sm text-muted-foreground leading-relaxed">
							{message}
						</p>
					</div>
				</div>

				<div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
					<Button variant="outline" onClick={onClose}>
						{cancelText}
					</Button>
					<Button
						variant={getConfirmVariant()}
						onClick={() => {
							onConfirm();
							onClose();
						}}
					>
						{confirmText}
					</Button>
				</div>
			</div>
		</BaseModal>
	);
}
