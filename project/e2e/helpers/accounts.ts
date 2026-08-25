import path from "node:path";

export type AccountKey = "a" | "b" | "c";

export interface Account {
	key: AccountKey;
	/** role in the runbook - A owns the workspace, B is invited, C is a second member or guest. */
	role: string;
	email?: string;
	password?: string;
	storageState: string;
}

/** account definitions - B and C are optional, so the suite still runs for someone who has configured only one login. */
export const ACCOUNTS: Record<AccountKey, Account> = {
	a: {
		key: "a",
		role: "owner",
		email: process.env.E2E_USER_EMAIL,
		password: process.env.E2E_USER_PASSWORD,
		storageState: path.join(__dirname, "..", ".auth/user-a.json"),
	},
	b: {
		key: "b",
		role: "invited member",
		email: process.env.E2E_USER_B_EMAIL,
		password: process.env.E2E_USER_B_PASSWORD,
		storageState: path.join(__dirname, "..", ".auth/user-b.json"),
	},
	c: {
		key: "c",
		role: "second member",
		email: process.env.E2E_USER_C_EMAIL,
		password: process.env.E2E_USER_C_PASSWORD,
		storageState: path.join(__dirname, "..", ".auth/user-c.json"),
	},
};

/** configured - whether this account has both halves of a credential. */
export function isConfigured(account: Account): boolean {
	return Boolean(account.email && account.password);
}
