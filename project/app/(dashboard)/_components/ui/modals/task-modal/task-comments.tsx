"use client";

import { MessageSquare, Send } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/buttons/button";

export function TaskComments() {
	return (
		<div className="flex flex-col h-full bg-surface-container-lowest">
			{/* Header */}
			<div className="px-4 py-4 pr-16 border-b border-outline-variant flex items-center justify-between">
				<h3 className="text-sm font-semibold text-foreground">Task Comments</h3>
				<MessageSquare className="h-4 w-4 text-secondary" />
			</div>

			{/* Comments List (Placeholder) */}
			<div className="flex-1 overflow-y-auto p-4 space-y-6">
				{/* Example Comment */}
				<div className="flex gap-3">
					<Image
						src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
						alt="Alex Chen"
						width={32}
						height={32}
						className="rounded-full bg-surface-variant shrink-0"
					/>
					<div className="flex-1 space-y-1">
						<div className="flex items-center gap-2">
							<span className="text-sm font-medium text-foreground">
								Alex Chen
							</span>
							<span className="text-xs text-secondary">
								Yesterday at 4:30 PM
							</span>
						</div>
						<p className="text-sm text-on-surface">
							I've uploaded the initial wireframes to the shared drive. Let me
							know if the structure aligns with what we discussed.
						</p>

						{/* Nested Reply */}
						<div className="mt-3 flex gap-3 border-l-2 border-outline-variant/30 pl-3">
							<Image
								src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
								alt="Sarah Jenkins"
								width={24}
								height={24}
								className="rounded-full bg-surface-variant shrink-0"
							/>
							<div className="flex-1 space-y-1">
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium text-foreground">
										Sarah Jenkins
									</span>
									<span className="text-xs text-secondary">
										Today at 9:15 AM
									</span>
								</div>
								<p className="text-sm text-on-surface">
									Looks solid, Alex. I'll review them by EOD.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Comment Input */}
			<div className="p-4 border-t border-outline-variant mt-auto">
				<div className="relative border border-outline-variant rounded-lg overflow-hidden bg-surface focus-within:ring-2 focus-within:ring-primary/20 transition-all">
					<textarea
						placeholder="Write a comment..."
						className="w-full min-h-20 p-3 text-sm bg-transparent border-none focus:outline-none resize-y pb-12"
					/>
					<div className="absolute bottom-2 right-2">
						<Button
							size="icon-sm"
							className="h-8 w-8 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
						>
							<Send className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
