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
	//
	// Closing is deliberately NOT done here any more. The delete is a real server
	// call now, and dismissing the dialog the instant the button is pressed would
	// hide the busy state and leave a failure with nowhere to appear except a
	// toast over a page that looks like nothing happened. The caller closes it
	// once the server has answered.
	const handleConfirm = useCallback(() => {
		if (isConfirmed) {
			onConfirmDelete();
		}
	}, [isConfirmed, onConfirmDelete]);

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
