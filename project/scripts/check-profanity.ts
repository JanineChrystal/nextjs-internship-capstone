/**
 * Verifies comment moderation end to end.
 *
 *     pnpm check:profanity
 *
 * Checks the local English word list, then the Filipino Profanity API - its
 * health, both endpoints it uses, and how long each takes. Run it after changing
 * FILIPINO_PROFANITY_API_URL, or when moderation seems not to be firing.
 */

// Marks this file as a module. Without an import or export, TypeScript treats
// a script as global scope, and these two share helper names like ok() and bad().
export {};

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

const ok = (m: string) => console.log(`${GREEN}  PASS${RESET} ${m}`);
const bad = (m: string) => console.log(`${RED}  FAIL${RESET} ${m}`);
const warn = (m: string) => console.log(`${YELLOW}  WARN${RESET} ${m}`);
const note = (m: string) => console.log(`${DIM}       ${m}${RESET}`);

function heading(title: string) {
	console.log(`\n${title}\n${"-".repeat(title.length)}`);
}

const BASE = (
	process.env.FILIPINO_PROFANITY_API_URL?.replace(/\/+$/, "") ||
	"https://filipino-profanity-api-latest.vercel.app/api"
).trim();

async function post(path: string, text: string) {
	const started = Date.now();
	try {
		const res = await fetch(`${BASE}${path}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ text }),
			signal: AbortSignal.timeout(15000),
		});
		const ms = Date.now() - started;
		const json = await res.json().catch(() => null);
		return { status: res.status, ms, json };
	} catch (error) {
		return {
			status: 0,
			ms: Date.now() - started,
			json: null,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

async function main() {
	console.log("\nComment moderation\n==================");
	note(`API base: ${BASE}`);

	heading("English detector (local word list)");
	try {
		const { Filter } = await import("bad-words");
		const filter = new Filter();
		const cases: [string, boolean][] = [
			["Let us review the board", false],
			["this is shit", true],
			["assignment deadline", false],
		];
		let failures = 0;
		for (const [text, expected] of cases) {
			const actual = filter.isProfane(text);
			if (actual === expected) {
				ok(`${JSON.stringify(text)} -> ${actual}`);
			} else {
				bad(`${JSON.stringify(text)} -> ${actual}, expected ${expected}`);
				failures++;
			}
		}
		if (failures === 0) note("Runs in-process - no network, cannot fail.");
	} catch (error) {
		bad(`bad-words failed to load: ${error}`);
	}

	heading("Filipino API - health");
	try {
		const started = Date.now();
		const res = await fetch(`${BASE}/health`, {
			signal: AbortSignal.timeout(15000),
		});
		const ms = Date.now() - started;
		const json = (await res.json()) as {
			status?: string;
			database?: { connected?: boolean; wordCount?: string };
		};
		if (res.ok && json.status === "ok") {
			ok(`reachable in ${ms}ms - ${json.database?.wordCount ?? "?"} words`);
			if (ms > 3000) {
				warn("That was a cold start. The first comment after idle is slowest.");
			}
		} else {
			bad(`unhealthy: ${res.status}`);
		}
	} catch (error) {
		bad(`unreachable: ${error instanceof Error ? error.message : error}`);
		note(
			"Moderation will fail open - comments still post, English still runs.",
		);
		return;
	}

	heading("Filipino API - /check");
	for (const [text, expected] of [
		["Let us review the board tomorrow", false],
		["You are gago", true],
		["yawa ka uy", true],
	] as [string, boolean][]) {
		const r = await post("/check", text);
		const actual = r.json?.hasProfanity;
		if (actual === expected) ok(`${r.ms}ms  ${JSON.stringify(text)}`);
		else bad(`${JSON.stringify(text)} -> ${actual}, expected ${expected}`);
	}

	heading("Filipino API - /variants/lookup (leetspeak)");
	note("/check does NOT catch obfuscated text; this endpoint is why it works.");
	for (const [text, expected] of [
		["g4g0 ka talaga", true],
		["hello team", false],
	] as [string, boolean][]) {
		const r = await post("/variants/lookup", text);
		const actual = r.json?.hasMatch;
		if (actual === expected) ok(`${r.ms}ms  ${JSON.stringify(text)}`);
		else bad(`${JSON.stringify(text)} -> ${actual}, expected ${expected}`);
	}

	heading("Rate limit");
	note("POST /check and /variants/lookup allow 30 requests per minute per IP.");
	note("Every user of this app shares one server IP, so a busy thread can hit");
	note("it. A 429 fails open: the comment posts, unflagged, and is logged.");

	console.log("");
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
