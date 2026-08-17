import type { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { claimPendingInvitesForUserDAL } from "@/lib/dal/pending-invites";
import { deleteUserFromDB, upsertUserInDB } from "@/lib/dal/users";
import type { NewDbUser } from "@/lib/types/user";

export async function POST(req: Request) {
	const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

	if (!WEBHOOK_SECRET) {
		throw new Error(
			"Please add CLERK_WEBHOOK_SECRET to your environment variables",
		);
	}

	// get the incoming request headers to extract svix signatures
	const headerPayload = await headers();
	const svix_id = headerPayload.get("svix-id");
	const svix_timestamp = headerPayload.get("svix-timestamp");
	const svix_signature = headerPayload.get("svix-signature");

	// reject the request immediately if any svix headers are missing
	if (!svix_id || !svix_timestamp || !svix_signature) {
		return new Response("Error occurred -- missing svix headers", {
			status: 400,
		});
	}

	// parse the raw request body as json and stringify it for svix verification
	const payload = await req.json();
	const body = JSON.stringify(payload);

	// initialize a new svix webhook verifier using your secret
	const wh = new Webhook(WEBHOOK_SECRET);

	let evt: WebhookEvent;

	// attempt to cryptographically verify the incoming webhook payload
	try {
		evt = wh.verify(body, {
			"svix-id": svix_id,
			"svix-timestamp": svix_timestamp,
			"svix-signature": svix_signature,
		}) as WebhookEvent;
	} catch (err) {
		console.error("Error verifying webhook:", err);
		return new Response("Error occurred during verification", {
			status: 400,
		});
	}

	// extract the specific event type and the primary id from the payload
	const eventType = evt.type;
	const { id } = evt.data;

	// process user creation and update events using the upsert pattern
	if (eventType === "user.created" || eventType === "user.updated") {
		const data = evt.data;

		// map the raw clerk webhook data directly into the database insert type
		const userToSync: NewDbUser = {
			clerkId: id as string,
			email: data.email_addresses[0]?.email_address || "",
			firstName: data.first_name || null,
			lastName: data.last_name || null,
			imageUrl: data.image_url || null,
		};

		try {
			// sync the user data to neon database by passing the single object
			const syncedUser = await upsertUserInDB(userToSync);

			// Grant any access that was invited before this person had an account.
			// Deliberately in its own try/catch and outside the user transaction: a
			// failure to claim invites must never undo user creation, and Clerk
			// retrying the whole webhook is safe because claiming is idempotent.
			if (eventType === "user.created" && userToSync.email) {
				try {
					const { claimedCount } = await claimPendingInvitesForUserDAL(
						userToSync.email,
						syncedUser.id,
					);
					if (claimedCount > 0) {
						console.log(
							`Claimed ${claimedCount} pending invite(s) for ${userToSync.email}`,
						);
					}
				} catch (claimError) {
					console.error("Pending invite claim failed:", claimError);
				}
			}

			return new Response("User synced successfully", { status: 200 });
		} catch (err) {
			console.error("Database sync failed:", err);
			return new Response("Internal Server Error", { status: 500 });
		}
	}

	// process user deletion events
	if (eventType === "user.deleted") {
		try {
			// attempt to soft delete the user in the database
			await deleteUserFromDB(id as string);
			return new Response("User soft deleted successfully", { status: 200 });
		} catch (error) {
			// check if the error is the custom not found error
			if (
				error instanceof Error &&
				error.message === "User already deleted or user does not exist"
			) {
				// return 200 ok to clerk so it stops retrying this specific webhook event
				return new Response("Ignored: User already deleted", { status: 200 });
			}

			// return a 500 error for all other genuine database failures so clerk retries later
			console.error("Database delete failed:", error);
			return new Response("Internal Server Error", { status: 500 });
		}
	}

	// return a generic success for any other unhandled clerk events
	return new Response("Webhook received successfully", { status: 200 });
}
