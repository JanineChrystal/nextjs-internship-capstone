import "server-only";
import { NOTIFIER_TIMEOUT_MS } from "@/lib/constants/contact";
import type {
	ContactNotification,
	ContactNotifier,
} from "@/lib/types/notifier";
import { buildTelegramMessage } from "./format";

/**
 * Pushes the enquiry to a Telegram chat, so it arrives on a phone.
 *
 * Email and Telegram are not redundant - they answer different questions. Email
 * is the record you reply from; Telegram is the one that buzzes in your pocket
 * within a second and needs no inbox open. Running both means a missed enquiry
 * requires two independent services to fail at once.
 *
 * This class is transport only. How the message reads is `buildTelegramMessage`
 * in ./format, which is pure and tested.
 *
 * ## The two values you need, and why the chat id is the fiddly one
 *
 * `TELEGRAM_BOT_TOKEN` comes straight from @BotFather when you create the bot.
 * `TELEGRAM_CHAT_ID` cannot be read anywhere in the Telegram UI: it is assigned
 * by the API, and the only way to see it is to message your bot and then ask the
 * API what it received. `pnpm check:notifiers` does exactly that.
 */
export class TelegramNotifier implements ContactNotifier {
	readonly channel = "telegram";

	/**
	 * Read at call time rather than at module load.
	 *
	 * `lib/rate-limit.ts` reads its variables at module scope and throws when one
	 * is missing, which is why the contact action has to import it lazily. This
	 * class does not repeat that: with no token set it reports itself
	 * unconfigured, so the app builds and runs normally until you add one.
	 */
	private get botToken(): string | undefined {
		return process.env.TELEGRAM_BOT_TOKEN;
	}

	private get chatId(): string | undefined {
		return process.env.TELEGRAM_CHAT_ID;
	}

	isConfigured(): boolean {
		return Boolean(this.botToken && this.chatId);
	}

	async deliver(notification: ContactNotification): Promise<void> {
		const response = await fetch(
			`https://api.telegram.org/bot${this.botToken}/sendMessage`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					chat_id: this.chatId,
					text: buildTelegramMessage(notification),
					// HTML rather than Telegram's MarkdownV2, which requires escaping
					// eighteen different characters including '.', '-' and '!' - all of
					// which appear in ordinary prose. One missed escape rejects the
					// whole message, so HTML's three characters are the safer target.
					parse_mode: "HTML",
					// The sender's email would otherwise be turned into a link preview
					// card, pushing the actual message out of the notification.
					disable_web_page_preview: true,
				}),
				signal: AbortSignal.timeout(NOTIFIER_TIMEOUT_MS),
			},
		);

		// Telegram answers HTTP 200 with { ok: false } for application-level
		// problems - a wrong chat id, a bot the recipient never started - so the
		// status code alone is not enough to conclude the alert was delivered.
		const payload = (await response.json().catch(() => null)) as {
			ok?: boolean;
			description?: string;
		} | null;

		if (!response.ok || !payload?.ok) {
			throw new Error(
				`Telegram responded ${response.status}${
					payload?.description ? `: ${payload.description}` : ""
				}`,
			);
		}
	}
}
