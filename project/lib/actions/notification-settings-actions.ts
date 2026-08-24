"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import { updateNotificationSettingsDAL } from "@/lib/dal/notification-settings";
import type { NotificationSettingsDTO } from "@/lib/dtos/notification-settings-dto";
import { updateNotificationSettingsSchema } from "@/lib/validations/notification-settings-schema";

/**
 * update notification settings - handles client-side toggles for
 * email preferences, enforcing strict validation to prevent
 * unauthorized key updates.
 */
export async function updateNotificationSettingsAction(
	patch: unknown,
): Promise<{
	success: boolean;
	data?: NotificationSettingsDTO;
	error?: string;
}> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		const validationResult = updateNotificationSettingsSchema.safeParse(patch);
		if (!validationResult.success) {
			return {
				success: false,
				error:
					validationResult.error.issues[0]?.message ??
					"Invalid notification settings",
			};
		}

		const settings = await updateNotificationSettingsDAL(validationResult.data);

		revalidatePath("/settings");
		return { success: true, data: settings };
	} catch (error) {
		console.error("updateNotificationSettingsAction error:", error);
		return { success: false, error: "Could not save notification settings" };
	}
}
