"use server";

import { requireUser } from "@/lib/dal/auth";
import { actionRateLimiter } from "@/lib/rate-limit";
// ... other imports like db and schemas

export async function createProjectAction(rawInput: unknown) {
	// 1. Authenticate the user (Who is making the request?)
	const user = await requireUser();

	// 2. Check the rate limit using their unique ID
	// We prepend a unique string so we can have different limits for different actions later
	const { success } = await actionRateLimiter.limit(
		`create_project_${user.id}`,
	);

	if (!success) {
		throw new Error("You are doing that too fast. Please wait a few seconds.");
	}

	// 3. Validation & Database Logic goes here...
	// const parsed = createProjectSchema.safeParse(rawInput);
	// ...
}
