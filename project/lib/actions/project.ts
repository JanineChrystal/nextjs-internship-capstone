"use server";

import { requireUser } from "@/lib/dal/auth";
import { actionRateLimiter } from "@/lib/rate-limit";

export async function createProjectAction(formData: FormData) {
	// 1. Authenticate user via DAL
	const user = await requireUser();

	// 2. Check rate limit bound to this user's ID
	const { success } = await actionRateLimiter.limit(
		`create_project_${user.id}`,
	);

	if (!success) {
		return {
			error: "You are doing that too fast. Please wait a few seconds.",
		};
	}

	// 3. Extract and validate form input
	const title = formData.get("title") as string;
	if (!title || title.trim().length === 0) {
		return { error: "Project title is required." };
	}

	// 4. DB logic will go here (via Drizzle/Neon)
	// ...

	return { success: true };
}
