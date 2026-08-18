import { Button } from "@/components/ui/buttons/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate } from "@/lib/utils/date";

interface GridDateCellProps {
	className: string;
	date: string | undefined;
	onSelect: (date: string) => void;
}

export function GridDateCell({ className, date, onSelect }: GridDateCellProps) {
	return (
		<div className={className}>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="ghost"
						className="h-8 px-2 text-sm text-secondary hover:text-foreground font-normal"
					>
						{formatDate(date || "--")}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						mode="single"
						selected={date && date !== "--" ? new Date(date) : undefined}
						onSelect={(newDate) => {
							if (newDate) {
								onSelect(newDate.toISOString());
							}
						}}
						initialFocus
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}
