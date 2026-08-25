import { AlertTriangle, Info, Trash2 } from "lucide-react";

export const WARNING_MODAL_CONFIG = {
	danger: {
		icon: Trash2,
		iconClass: "text-red-600 dark:text-red-400",
		confirmVariant: "destructive" as const,
	},
	warning: {
		icon: AlertTriangle,
		iconClass: "text-amber-600 dark:text-amber-400",
		confirmVariant: "default" as const,
	},
	info: {
		icon: Info,
		iconClass: "text-blue-600 dark:text-blue-400",
		confirmVariant: "default" as const,
	},
};
