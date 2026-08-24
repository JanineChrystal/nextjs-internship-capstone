"use client";

import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useLandingUiStore } from "@/stores/use-landing-ui-store";
import { CONTACT_COPY } from "../../_constants/contact";
import { ContactForm } from "./contact-form";

/**
 * contact drawer - a bottom-entering sheet using the app's existing
 * Radix UI implementation to maintain consistent focus-trap behavior
 * without adding new dependencies.
 */
export function ContactDrawer() {
	const isOpen = useLandingUiStore((state) => state.isContactOpen);
	const setOpen = useLandingUiStore((state) => state.setContactOpen);

	return (
		<Sheet open={isOpen} onOpenChange={setOpen}>
			<SheetContent
				side="bottom"
				// landscape scroll - enables overflow with max height to ensure the submit button remains accessible on short mobile screens.
				className="max-h-[92dvh] overflow-y-auto rounded-t-2xl border-t"
			>
				<div className="mx-auto w-full max-w-2xl pb-6">
					<SheetHeader className="px-0 pt-2">
						<SheetTitle className="text-xl">{CONTACT_COPY.title}</SheetTitle>
						<SheetDescription>{CONTACT_COPY.description}</SheetDescription>
					</SheetHeader>

					<div className="mt-4">
						<ContactForm onSentAction={() => setOpen(false)} />
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
