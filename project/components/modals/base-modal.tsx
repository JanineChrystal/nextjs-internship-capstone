import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface BaseModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
	maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
}

export function BaseModal({
	isOpen,
	onClose,
	title,
	children,
	maxWidth = "2xl",
}: BaseModalProps) {
	const maxWidthClasses = {
		sm: "max-w-sm",
		md: "max-w-md",
		lg: "max-w-lg",
		xl: "max-w-xl",
		"2xl": "sm:max-w-2xl",
		"3xl": "sm:max-w-3xl",
		"4xl": "sm:max-w-4xl",
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent
				className={`bg-background p-0 gap-0 overflow-hidden shadow-lg border-border w-full ${maxWidthClasses[maxWidth]}`}
			>
				<DialogHeader className="px-6 py-4 border-b border-border bg-background">
					<DialogTitle className="font-semibold text-foreground text-left">
						{title}
					</DialogTitle>
				</DialogHeader>

				<div className="overflow-y-auto max-h-[calc(100vh-12rem)] bg-background">
					{children}
				</div>
			</DialogContent>
		</Dialog>
	);
}
