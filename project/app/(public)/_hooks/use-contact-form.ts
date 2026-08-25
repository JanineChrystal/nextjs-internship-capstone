"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { submitContactMessageAction } from "@/lib/actions/contact-actions";
import { reportActionError, reportActionSuccess } from "@/lib/utils/toast";
import {
	type ContactMessageFormValues,
	ContactMessageSchema,
} from "@/lib/validations/contact-schema";

/**
 * use-contact-form hook - extracts form state and mutation logic from the
 * component to isolate UI layout from data flow, intentionally avoiding
 * optimistic updates until the server confirms receipt.
 */
export function useContactForm() {
	// Local state
	const [isSent, setIsSent] = useState(false);

	const form = useForm<ContactMessageFormValues>({
		resolver: zodResolver(ContactMessageSchema),
		defaultValues: {
			name: "",
			email: "",
			organization: "",
			topic: "general",
			message: "",
			// The honeypot starts empty and no control ever writes to it. Registering
			// it here rather than leaving it out of the form entirely is what makes
			// the field part of the submitted payload, which is the whole point.
			website: "",
		},
	});

	// Handlers
	const onSubmit = form.handleSubmit(async (values) => {
		const result = await submitContactMessageAction(values);

		if (!result.success) {
			reportActionError(result.error ?? "Could not send your message");
			return;
		}

		reportActionSuccess("Message sent");
		form.reset();
		setIsSent(true);
	});

	const reset = () => {
		form.reset();
		setIsSent(false);
	};

	return {
		form,
		isSent,
		isSubmitting: form.formState.isSubmitting,
		onSubmit,
		reset,
	};
}
