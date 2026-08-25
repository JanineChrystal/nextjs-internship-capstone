import { beforeEach, describe, expect, it, vi } from "vitest";
import { toContactMessageDTO } from "@/lib/dtos/contact-dto";
import type { DbContactMessage } from "@/lib/types/contact";
import { decrypt } from "@/lib/utils/encryption";

vi.mock("@/lib/utils/encryption", () => ({ decrypt: vi.fn() }));

const decryptMock = vi.mocked(decrypt);
const now = new Date("2026-08-24T10:00:00.000Z");

const row = {
	id: "msg-1",
	name: "cipher-name",
	email: "cipher-email",
	organization: "cipher-org",
	topic: "demo",
	message: "cipher-message",
	respondedAt: null,
	notifiedAt: null,
	createdAt: now,
	updatedAt: now,
	deletedAt: null,
} as unknown as DbContactMessage;

beforeEach(() => {
	decryptMock.mockReset();
});

describe("toContactMessageDTO", () => {
	it("decrypts the name, email, organization and message", () => {
		decryptMock.mockImplementation((value) =>
			value ? `plain:${value}` : null,
		);

		const dto = toContactMessageDTO(row);

		expect(dto.name).toBe("plain:cipher-name");
		expect(dto.email).toBe("plain:cipher-email");
		expect(dto.organization).toBe("plain:cipher-org");
		expect(dto.message).toBe("plain:cipher-message");
	});

	/** mixed-era rows - the table holds plain text from before the key change and ciphertext after, so the `|| row.field` fallback keeps old messages readable instead of blank. */
	it("falls back to the raw value when decryption yields nothing", () => {
		decryptMock.mockReturnValue("");

		const dto = toContactMessageDTO(row);

		expect(dto.name).toBe("cipher-name");
		expect(dto.email).toBe("cipher-email");
		expect(dto.message).toBe("cipher-message");
		expect(dto.organization).toBe("cipher-org");
	});

	it("keeps a null organization null rather than decrypting it", () => {
		/** guarded optional - the only nullable field of the four, so null must never reach decrypt. */
		decryptMock.mockImplementation((value) =>
			value ? `plain:${value}` : null,
		);

		const dto = toContactMessageDTO({
			...row,
			organization: null,
		} as DbContactMessage);

		expect(dto.organization).toBeNull();
		expect(decryptMock).not.toHaveBeenCalledWith(null);
	});

	it("passes the topic through unencrypted", () => {
		/** topic stays plain - it is an enum used for filtering. */
		decryptMock.mockImplementation((value) =>
			value ? `plain:${value}` : null,
		);

		expect(toContactMessageDTO(row).topic).toBe("demo");
	});

	it("strips the internal triage fields", () => {
		/** field allow-list - respondedAt, notifiedAt, updatedAt and deletedAt are bookkeeping and must not reach a client component. */
		decryptMock.mockImplementation((value) => value ?? null);

		const dto = toContactMessageDTO(row);

		expect(Object.keys(dto).sort()).toEqual([
			"createdAt",
			"email",
			"id",
			"message",
			"name",
			"organization",
			"topic",
		]);
	});
});
