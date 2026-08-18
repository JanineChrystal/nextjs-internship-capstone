import { useCallback, useState } from "react";

export function useDeleteProjectModal(
	projectName: string,
	onOpenChange: (open: boolean) => void,
	onConfirmDelete: () => void,
) {
	// Local state
	const [confirmationText, setConfirmationText] = useState("");

	// Derived state
	const isConfirmed = confirmationText === projectName;

	// Handlers
	const handleConfirm = useCallback(() => {
		if (isConfirmed) {
			onConfirmDelete();
			onOpenChange(false);
		}
	}, [isConfirmed, onConfirmDelete, onOpenChange]);

	const handleOpenChange = useCallback(
		(newOpen: boolean) => {
			if (!newOpen) {
				setConfirmationText("");
			}
			onOpenChange(newOpen);
		},
		[onOpenChange],
	);

	return {
		confirmationText,
		setConfirmationText,
		isConfirmed,
		handleConfirm,
		handleOpenChange,
	};
}
