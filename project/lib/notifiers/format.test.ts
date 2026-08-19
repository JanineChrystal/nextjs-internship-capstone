import { describe, expect, it } from "vitest";
import { TELEGRAM_MAX_LENGTH } from "@/lib/constants/contact";
import type { ContactNotification } from "@/lib/types/notifier";
import {
	buildHtmlBody,
	buildPlainTextBody,
	buildSubject,
	buildTelegramMessage,
	escapeHtml,
	fitTelegramBody,
	toTopicLabel,
} from "./format";

/**
 * These test the one part of the notification pipeline that is pure logic and
 * has real edge cases: turning attacker-controlled text into markup.
 *
 * The delivery itself is not tested here - a test that asserts `fetch` was called
 * with a particular body mostly asserts that the code is written the way it is
 * written. `pnpm check:notifiers` covers the part that actually breaks in
 * practice, which is whether the credentials work.
 */

const notification: ContactNotification = {
	id: "11111111-2222-3333-4444-555555555555",
	name: "Juan dela Cruz",
	email: "juan@example.com",
	organization: null,
	topic: "demo",
	message: "Hello there.",
	receivedAt: new Date("2026-08-19T04:05:06.000Z"),
};

describe("escapeHtml", () => {
	it("escapes the five characters that have meaning in HTML", () => {
		expect(escapeHtml(`<a href="x">&'`)).toBe(
			"&lt;a href=&quot;x&quot;&gt;&amp;&#39;",
		);
	});

	it("escapes the ampersand first, so entities are not double-escaped", () => {
		// The bug this guards against: replacing "<" before "&" turns "<" into
		// "&lt;" and then that ampersand into "&amp;lt;", printing the entity
		// instead of the character.
		expect(escapeHtml("<")).toBe("&lt;");
		expect(escapeHtml("&lt;")).toBe("&amp;lt;");
	});

	it("neutralises a script tag someone submits in the message body", () => {
		const hostile = '<script>alert("xss")</script>';
		const escaped = escapeHtml(hostile);

		expect(escaped).not.toContain("<script");
		expect(escaped).not.toContain("</script>");
		expect(escaped).toContain("&lt;script&gt;");
	});

	it("leaves ordinary text untouched", () => {
		expect(escapeHtml("Hi - can we book a demo for Q3?")).toBe(
			"Hi - can we book a demo for Q3?",
		);
	});
});

describe("toTopicLabel", () => {
	it("maps a topic to the label the form showed", () => {
		expect(toTopicLabel("demo")).toBe("Request a walkthrough");
		expect(toTopicLabel("general")).toBe("General question");
	});
});

describe("buildSubject", () => {
	it("names the topic and the sender, so an inbox is scannable", () => {
		expect(buildSubject(notification)).toBe(
			"[Takda PH] Request a walkthrough - Juan dela Cruz",
		);
	});

	it("returns plain text, so the caller escapes it for its own format", () => {
		// Returning pre-escaped text here would be double-escaped by the email
		// builder, which escapes everything it interpolates.
		const subject = buildSubject({ ...notification, name: "A & B Corp" });
		expect(subject).toContain("A & B Corp");
		expect(subject).not.toContain("&amp;");
	});
});

describe("buildPlainTextBody", () => {
	it("includes the topic, sender, reference and message", () => {
		const body = buildPlainTextBody(notification);

		expect(body).toContain("Request a walkthrough");
		expect(body).toContain("juan@example.com");
		expect(body).toContain(notification.id);
		expect(body).toContain("Hello there.");
	});

	it("omits the organisation line entirely when there is none", () => {
		expect(buildPlainTextBody(notification)).not.toContain("Org:");
	});

	it("includes the organisation line when there is one", () => {
		const body = buildPlainTextBody({
			...notification,
			organization: "Acme Inc",
		});
		expect(body).toContain("Org:     Acme Inc");
	});
});

describe("buildHtmlBody", () => {
	it("neutralises markup submitted in the message", () => {
		const html = buildHtmlBody({
			...notification,
			message: '<img src=x onerror="alert(1)">',
		});

		// The tag itself must be gone. The words "img" and "onerror" survive as
		// visible TEXT, which is fine and is the point of escaping - what must not
		// survive is the "<" that would start a tag or the quote that would close
		// an attribute, because those are what make it executable.
		expect(html).not.toContain("<img");
		expect(html).not.toContain('onerror="');
		expect(html).toContain("&lt;img");
		expect(html).toContain("&quot;alert(1)&quot;");
	});

	it("neutralises markup submitted in the NAME, which is also interpolated", () => {
		// The name reaches three places in the email - the table, the closing
		// line, and the subject - so it is as much of a vector as the message.
		const html = buildHtmlBody({
			...notification,
			name: "</td><script>alert(1)</script>",
		});

		expect(html).not.toContain("<script");
		expect(html).toContain("&lt;/td&gt;");
	});

	it("turns newlines into <br /> AFTER escaping, so the tags survive", () => {
		const html = buildHtmlBody({
			...notification,
			message: "line one\nline two",
		});

		expect(html).toContain("line one<br />line two");
		// If <br /> were inserted before escaping, it would appear as an entity.
		expect(html).not.toContain("&lt;br");
	});

	it("omits the organisation row when there is none", () => {
		expect(buildHtmlBody(notification)).not.toContain("Organisation");
		expect(
			buildHtmlBody({ ...notification, organization: "Acme Inc" }),
		).toContain("Acme Inc");
	});
});

describe("buildTelegramMessage", () => {
	it("includes the sender, the message and the row id", () => {
		const text = buildTelegramMessage(notification);

		expect(text).toContain("Juan dela Cruz");
		expect(text).toContain("Hello there.");
		expect(text).toContain(`<code>${notification.id}</code>`);
	});

	it("escapes markup in the body but keeps its own tags intact", () => {
		const text = buildTelegramMessage({
			...notification,
			message: "<b>not bold</b>",
		});

		expect(text).toContain("&lt;b&gt;not bold&lt;/b&gt;");
		expect(text).toContain("<b>New message from the landing page</b>");
	});

	it("stays under Telegram's limit even for an oversized message", () => {
		const text = buildTelegramMessage({
			...notification,
			// Every character escapes to 5, so 4000 raw becomes 20000 escaped -
			// far past the cap. This is the case that would be silently rejected.
			message: "&".repeat(4000),
		});

		expect(text.length).toBeLessThanOrEqual(TELEGRAM_MAX_LENGTH);
		expect(text).toContain("[truncated");
	});

	it("keeps its closing </code> tag when the body was truncated", () => {
		// The bug this guards against: truncating the ASSEMBLED string instead of
		// the body cuts the footer off, leaving an unclosed <code> that Telegram
		// rejects outright - so the safety net would lose the alert.
		const text = buildTelegramMessage({
			...notification,
			message: "x".repeat(9000),
		});

		expect(text.endsWith("</code>")).toBe(true);
		expect(text.length).toBeLessThanOrEqual(TELEGRAM_MAX_LENGTH);
	});
});

describe("fitTelegramBody", () => {
	it("returns the escaped text untouched when it fits", () => {
		expect(fitTelegramBody("a & b", 100)).toBe("a &amp; b");
	});

	it("never cuts an entity in half", () => {
		// Budgets around the boundary of an "&amp;" are where a naive slice
		// produces "&am", which Telegram treats as invalid markup.
		for (let budget = 60; budget <= 90; budget++) {
			const result = fitTelegramBody(`${"x".repeat(50)}&&&&&&&&&&`, budget);
			const lastAmpersand = result.lastIndexOf("&");
			const lastSemicolon = result.lastIndexOf(";");

			// Every "&" that opened an entity must have been closed by a ";".
			// Both are -1 when the cut landed before any entity at all, which is
			// equally valid - hence "or equal" rather than a strict comparison.
			expect(lastAmpersand).toBeLessThanOrEqual(lastSemicolon);
		}
	});

	it("degrades to just the notice rather than throwing on a tiny budget", () => {
		expect(() => fitTelegramBody("x".repeat(500), 5)).not.toThrow();
	});
});
