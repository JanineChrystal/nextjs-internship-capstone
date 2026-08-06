import { format } from "date-fns";

export function formatDate(dateStr: string | undefined | null) {
	if (!dateStr || dateStr === "--") return "--";
	try {
		return format(new Date(dateStr), "MM/dd/yyyy");
	} catch {
		return dateStr;
	}
}
