"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import { updateNotificationSettingsDAL } from "@/lib/dal/notification-settings";
import type { NotificationSettingsDTO } from "@/lib/dtos/notification-settings-dto";
import { updateNotificationSettingsSchema } from "@/lib/validations/notification-settings-schema";

/**
 * Saves one or more changed email preferences.
 *
 * There is no matching read action: the settings page is server-rendered and
 * calls the DAL directly, so fetching through an action would add a round-trip
 * for data the server already had. Only the write needs an action, because the
 * toggles are client-side.
 *
 * The patch is validated with `.strict()`, so a key this page has no business
 * writing cannot be smuggled into the UPDATE even though the DAL spreads the
 * object it is given.
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
