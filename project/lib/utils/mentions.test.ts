import { describe, expect, it } from "vitest";
import {
	applyMentionAtCaret,
	extractMentionHandles,
	readMentionQuery,
	tokenizeMentions,
	toMentionHandle,
} from "./mentions";

const MEMBERS: Record<string, { userId: string; label: string }> = {
	janine: { userId: "u1", label: "Janine Chrystal" },
	juan: { userId: "u2", label: "Juan dela Cruz" },
};

const resolve = (handle: string) => MEMBERS[handle];

describe("toMentionHandle", () => {
	it("takes the local part and lower-cases it", () => {
		expect(toMentionHandle("Janine@gmail.com")).toBe("janine");
	});
});

describe("extractMentionHandles", () => {
	it("finds a mention at the start and mid-sentence", () => {
		expect(extractMentionHandles("@janine please look")).toEqual(["janine"]);
		expect(extractMentionHandles("cc @juan on this")).toEqual(["juan"]);
	});

	it("de-duplicates, so one person is never notified twice", () => {
		expect(extractMentionHandles("@janine and again @janine")).toEqual([
			"janine",
		]);
	});

	it("is case-insensitive", () => {
		expect(extractMentionHandles("@Janine @JANINE")).toEqual(["janine"]);
	});

	it("does NOT treat an email address as a mention", () => {
		// The bug this guards: without the preceding-character guard, every email
		// in a comment would try to mention a user called "gmail".
		expect(extractMentionHandles("mail me at juan@gmail.com")).toEqual([]);
	});

	it("finds several distinct handles", () => {
		expect(extractMentionHandles("@janine and @juan").sort()).toEqual([
			"janine",
			"juan",
		]);
	});

	it("returns nothing for a body with no mentions", () => {
		expect(extractMentionHandles("no mentions here")).toEqual([]);
	});

	it("reads handles containing dots and hyphens", () => {
		expect(extractMentionHandles("@maria.santos-cruz hi")).toEqual([
			"maria.santos-cruz",
		]);
	});
});

describe("tokenizeMentions", () => {
	it("splits text around a resolved mention", () => {
		expect(tokenizeMentions("hi @janine ok", resolve)).toEqual([
			{ type: "text", value: "hi " },
			{
				type: "mention",
				value: "@janine",
				userId: "u1",
				label: "Janine Chrystal",
			},
			{ type: "text", value: " ok" },
		]);
	});

	it("leaves an unresolved handle as plain text", () => {
		// "@lunch" is something people type without meaning a person.
		expect(tokenizeMentions("@lunch at 12", resolve)).toEqual([
			{ type: "text", value: "@lunch" },
			{ type: "text", value: " at 12" },
		]);
	});

	it("never emits markup, only data", () => {
		const hostile = "@janine <script>alert(1)</script>";
		const tokens = tokenizeMentions(hostile, resolve);
		const text = tokens.map((token) => token.value).join("");

		// The angle brackets survive as literal text; React escapes them on
		// render. Nothing here builds an HTML string.
		expect(text).toBe(hostile);
		expect(tokens.every((token) => typeof token.value === "string")).toBe(true);
	});

	it("round-trips the body exactly", () => {
		const body = "start @janine middle @juan end @nobody.";
		const rebuilt = tokenizeMentions(body, resolve)
			.map((token) => token.value)
			.join("");
		expect(rebuilt).toBe(body);
	});

	it("handles a body that is only a mention", () => {
		expect(tokenizeMentions("@juan", resolve)).toEqual([
			{
				type: "mention",
				value: "@juan",
				userId: "u2",
				label: "Juan dela Cruz",
			},
		]);
	});

	it("does not linkify an email address", () => {
		const tokens = tokenizeMentions("write to juan@gmail.com", resolve);
		expect(tokens.some((token) => token.type === "mention")).toBe(false);
	});
});

describe("readMentionQuery", () => {
	it("returns the partial handle at the caret", () => {
		const body = "hi @jan";
		expect(readMentionQuery(body, body.length)).toBe("jan");
	});

	it("returns an empty string right after the trigger", () => {
		// The suggestion list should open on "@" alone, showing every member.
		const body = "hi @";
		expect(readMentionQuery(body, body.length)).toBe("");
	});

	it("closes once a space is typed", () => {
		const body = "hi @jan ";
		expect(readMentionQuery(body, body.length)).toBeNull();
	});

	it("does not open inside an email address", () => {
		const body = "juan@gm";
		expect(readMentionQuery(body, body.length)).toBeNull();
	});

	it("returns null with no trigger at all", () => {
		expect(readMentionQuery("plain text", 10)).toBeNull();
	});
});

describe("applyMentionAtCaret", () => {
	it("replaces the partial handle and moves the caret past it", () => {
		const body = "hi @jan";
		const result = applyMentionAtCaret(body, body.length, "janine");

		expect(result.body).toBe("hi @janine ");
		expect(result.caret).toBe(result.body.length);
	});

	it("keeps the text after the caret intact", () => {
		// Picking a suggestion mid-sentence must not truncate the rest of it.
		const body = "hi @jan, thanks";
		const result = applyMentionAtCaret(body, 7, "janine");

		expect(result.body).toBe("hi @janine , thanks");
		expect(result.caret).toBe("hi @janine ".length);
	});

	it("inserts rather than corrupting when there is no trigger", () => {
		const result = applyMentionAtCaret("hello", 5, "juan");
		expect(result.body).toBe("hello@juan ");
	});
});
