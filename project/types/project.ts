export interface DangerZoneActionConfig {
	id: "archive" | "delete";
	title: string;
	description: string;
	isDestructive?: boolean;
}
