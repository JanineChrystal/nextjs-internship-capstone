"use client";

import { MessageCircle, Palette } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/buttons/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLandingUiStore } from "@/stores/use-landing-ui-store";
import { AppearanceDrawer } from "../appearance/appearance-drawer";
import { ContactDrawer } from "../contact/contact-drawer";

/**
 * floating dock - renders bottom-right floating action buttons for
 * appearance and contact drawers, positioned carefully to avoid system
 * UI overlays on mobile devices.
 */
export function FloatingDock() {
	const openContact = useLandingUiStore((state) => state.openContact);
	const openAppearance = useLandingUiStore((state) => state.openAppearance);
	const shouldReduceMotion = useReducedMotion();

	const actions = [
		{
			label: "Appearance & themes",
			icon: Palette,
			onClick: openAppearance,
			variant: "outline" as const,
		},
		{
			label: "Contact us",
			icon: MessageCircle,
			onClick: openContact,
			variant: "default" as const,
		},
	];

	return (
		<TooltipProvider delayDuration={200}>
			<motion.div
				className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex flex-col gap-2 sm:right-6 sm:bottom-6"
				initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				// delayed animation - delays dock entrance so it doesn't distract from the hero section's initial paint.
				transition={{ delay: 0.6, duration: 0.4 }}
			>
				{actions.map((action) => (
					<Tooltip key={action.label}>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant={action.variant}
								onClick={action.onClick}
								aria-label={action.label}
								className="size-11 rounded-full p-0 shadow-lg"
							>
								<action.icon className="size-5" aria-hidden="true" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="left">{action.label}</TooltipContent>
					</Tooltip>
				))}
			</motion.div>

			<AppearanceDrawer />
			<ContactDrawer />
		</TooltipProvider>
	);
}
