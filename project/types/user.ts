import type { users } from "@/lib/db/schema";

// type for selecting a user record from the database
export type User = typeof users.$inferSelect;

// type for inserting a new user record into the database
export type NewUser = typeof users.$inferInsert;
