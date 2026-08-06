"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";

export function AddTaskRow() {
	return (
		<Button
			variant="ghost"
			className="w-full justify-start text-secondary hover:text-on-surface hover:bg-transparent px-0 h-auto font-medium"
		>
			<Plus className="w-4 h-4 mr-2" />
			Add new task
		</Button>
	);
}
