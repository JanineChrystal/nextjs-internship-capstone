/**
 * Setup and connectivity check for the contact-form notification channels.
 *
 *     pnpm check:notifiers
 *
 * What it does, in order:
 *   1. reports which environment variables are present
 *   2. if TELEGRAM_BOT_TOKEN is set but TELEGRAM_CHAT_ID is not, reads the bot's
 *      recent updates and prints the chat ids it finds - this is the only way to
 *      discover a chat id, since Telegram does not show it anywhere in the app
 *   3. sends one real test message on every fully configured channel
 *
 * Pass --no-send to verify the credentials without sending anything:
 *
 *     pnpm check:notifiers --no-send
 *
 * This deliberately does NOT import lib/notifiers. Those modules are marked
 * `server-only`, which is correct - it makes importing one into a client
 * component a build error rather than a silent undefined - but it also means
 * they cannot be loaded outside Next's server runtime. More importantly, this
 * script answers a different question than the notifiers do: they ask "how
 * should this message be formatted", this asks "are these credentials real".
 * Keeping them apart is why this can be run before a single message exists.
 */

// Marks this file as a module. Without an import or export, TypeScript treats
// a script as global scope, and these two share helper names like ok() and bad().
export {};

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

const ok = (message: string) =>
	console.log(`${GREEN}  PASS${RESET} ${message}`);
const bad = (message: string) => console.log(`${RED}  FAIL${RESET} ${message}`);
const skip = (message: string) =>
	console.log(`${YELLOW}  SKIP${RESET} ${message}`);
const note = (message: string) =>
	console.log(`${DIM}       ${message}${RESET}`);

/**
 * Whether to stop short of actually sending.
 *
 * Worth having because "are these keys right" and "does a message arrive" are
 * different questions, and only the first needs asking repeatedly. Running the
 * full check five times while fixing a config mails yourself five times.
 */
const SENDGRID_ENDPOINT = "https://api.sendgrid.com/v3/mail/send";

const NO_SEND = process.argv.includes("--no-send");

function heading(title: string) {
	console.log(`\n${title}`);
	console.log("-".repeat(title.length));
}

function reportEnv() {
	heading("Environment");

	const vars = [
		"SENDGRID_API_KEY",
		"CONTACT_EMAIL_FROM",
		"CONTACT_EMAIL_TO",
		"TELEGRAM_BOT_TOKEN",
		"TELEGRAM_CHAT_ID",
	];

	for (const name of vars) {
		const value = process.env[name];
		if (!value) {
			skip(`${name} is not set`);
			continue;
		}
		// Secrets are shown only as a length and a prefix. Printing a key in full
		// puts it into terminal scrollback and, if this is ever run in CI, into a
		// build log that other people can read.
		const preview =
			name.includes("KEY") || name.includes("TOKEN")
				? `${value.slice(0, 6)}... (${value.length} chars)`
				: value;
		ok(`${name} = ${preview}`);
	}
}

/**
 * Finds the chat ids the bot can currently see.
 *
 * `getUpdates` only returns messages from the last 24 hours, and only ones sent
 * *after* the bot was created - so if this comes back empty, the fix is almost
 * always "send your bot a message first", not "the token is wrong".
 */
async function discoverChatIds(token: string): Promise<void> {
	heading("Telegram: discovering chat ids");

	const response = await fetch(
		`https://api.telegram.org/bot${token}/getUpdates`,
	);
	const payload = (await response.json()) as {
		ok: boolean;
		description?: string;
		result?: {
			message?: {
				chat?: { id: number; type: string; title?: string; username?: string };
			};
		}[];
	};

	if (!payload.ok) {
		bad(`getUpdates failed: ${payload.description ?? response.status}`);
		return;
	}

	const chats = new Map<number, string>();
	for (const update of payload.result ?? []) {
		const chat = update.message?.chat;
		if (chat) {
			chats.set(chat.id, chat.title ?? chat.username ?? chat.type);
		}
	}

	if (chats.size === 0) {
		skip("No recent chats found.");
		note("Open Telegram, find your bot, and send it any message.");
		note("Then run this script again. getUpdates only sees the last 24h.");
		return;
	}

	for (const [id, label] of chats) {
		ok(`TELEGRAM_CHAT_ID=${id}   ${DIM}(${label})${RESET}`);
	}
	note("Copy the id you want into .env.local as TELEGRAM_CHAT_ID.");
}

async function testTelegram(): Promise<void> {
	const token = process.env.TELEGRAM_BOT_TOKEN;
	const chatId = process.env.TELEGRAM_CHAT_ID;

	if (!token) {
		heading("Telegram");
		skip("TELEGRAM_BOT_TOKEN is not set - nothing to test.");
		note("Create a bot by messaging @BotFather and sending /newbot.");
		return;
	}

	heading("Telegram: token");
	const meResponse = await fetch(`https://api.telegram.org/bot${token}/getMe`);
	const me = (await meResponse.json()) as {
		ok: boolean;
		description?: string;
		result?: { username?: string };
	};

	if (!me.ok) {
		bad(`Token rejected: ${me.description ?? meResponse.status}`);
		return;
	}
	ok(`Token is valid - bot is @${me.result?.username ?? "unknown"}`);

	if (!chatId) {
		await discoverChatIds(token);
		return;
	}

	if (NO_SEND) {
		heading("Telegram: sending a test message");
		skip("--no-send given, not sending a test message.");
		return;
	}

	heading("Telegram: sending a test message");
	const sendResponse = await fetch(
		`https://api.telegram.org/bot${token}/sendMessage`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				chat_id: chatId,
				parse_mode: "HTML",
				text: "<b>Takda PH</b>\nContact notifications are wired up correctly.",
			}),
		},
	);
	const sent = (await sendResponse.json()) as {
		ok: boolean;
		description?: string;
	};

	if (!sent.ok) {
		bad(`Send failed: ${sent.description ?? sendResponse.status}`);
		if (sent.description?.includes("chat not found")) {
			note("The chat id is wrong, or you have not messaged the bot yet.");
		}
		return;
	}
	ok("Test message sent - check Telegram.");
}

async function testSendGrid(): Promise<void> {
	heading("SendGrid");

	const apiKey = process.env.SENDGRID_API_KEY;
	const from = process.env.CONTACT_EMAIL_FROM;
	const to = (process.env.CONTACT_EMAIL_TO ?? "")
		.split(",")
		.map((address) => address.trim())
		.filter(Boolean);

	if (!apiKey || !from || to.length === 0) {
		skip("SENDGRID_API_KEY, CONTACT_EMAIL_FROM or CONTACT_EMAIL_TO missing.");
		note("Create a key at https://app.sendgrid.com/settings/api_keys");
		note("Restricted Access with only Mail Send enabled is enough.");
		note("CONTACT_EMAIL_FROM must match a verified sender exactly.");
		return;
	}

	// The auth probe posts a deliberately invalid body, so validation fails
	// before any mail is queued and nothing is sent - but the status still
	// separates "key rejected" (401) from "key fine, payload bad" (400).
	//
	// A read-only endpoint would be the obvious check, but a Mail Send-only key
	// is forbidden from every one of them, so judging the key that way reports a
	// working key as broken - the same trap the Resend version documented.
	const probe = await fetch(SENDGRID_ENDPOINT, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({}),
	});

	if (probe.status === 401) {
		bad("Key rejected - it has been revoked, or belongs to another account.");
		return;
	}
	if (probe.status === 403) {
		bad("Key authenticates but lacks Mail Send permission.");
		note("Edit the key at app.sendgrid.com/settings/api_keys and enable it.");
		return;
	}
	ok("Key authenticates.");

	// The single most common misconfiguration on this setup. Single Sender
	// Verification proves ONE address, and SendGrid matches it exactly - a
	// different address, or a typo in the display name's address, is a 403 on
	// every send while looking perfectly reasonable in the environment file.
	note(`Sending as ${from}`);
	note(
		"This must match a verified sender at Settings > Sender Authentication,",
	);
	note(
		"or every send fails with a does-not-match-a-verified-Sender-Identity error.",
	);

	if (NO_SEND) {
		skip("--no-send given, not sending a test email.");
		return;
	}

	const response = await fetch(SENDGRID_ENDPOINT, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			personalizations: to.map((address) => ({ to: [{ email: address }] })),
			from: parseSender(from),
			subject: "[Takda PH] Contact notifications are wired up",
			content: [
				{
					type: "text/plain",
					value: "This is a test from pnpm check:notifiers. Nothing to action.",
				},
			],
		}),
	});

	// 202 Accepted, not 200: SendGrid queues rather than delivering inline.
	if (!response.ok) {
		const detail = await response.text().catch(() => "");
		bad(`SendGrid responded ${response.status}: ${detail.slice(0, 300)}`);
		if (detail.includes("Sender Identity")) {
			note("CONTACT_EMAIL_FROM does not match a verified sender.");
			note("Check the exact address at Settings > Sender Authentication.");
		}
		return;
	}

	ok(`Test email accepted for ${to.join(", ")} - check the inbox.`);
	note("Single-sender mail is not DKIM-aligned, so check spam as well.");
}

/** Splits "Takda PH <a@b.com>" into SendGrid's object form. */
function parseSender(value: string): { email: string; name?: string } {
	const match = value.match(/^\s*(.*?)\s*<\s*(.+?)\s*>\s*$/);
	if (!match) return { email: value.trim() };
	const [, name, email] = match;
	return name ? { email, name } : { email };
}

async function main() {
	console.log("\nContact notification channels\n=============================");
	reportEnv();
	// Sequential, not Promise.all: the output is a setup checklist meant to be
	// read top to bottom, and interleaved results from two services would be
	// harder to follow than the second or so this costs.
	await testSendGrid();
	await testTelegram();
	console.log("");
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
