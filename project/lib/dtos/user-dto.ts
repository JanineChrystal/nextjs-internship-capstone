import type { DbUser } from "@/lib/types/user";

export interface UserOutputDTO {
	id: string;
	email: string;
	firstName: string | null;
	lastName: string | null;
	imageUrl: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export function toUserDTO(user: DbUser): UserOutputDTO {
	return {
		id: user.id,
		email: user.email,
		firstName: user.firstName,
		lastName: user.lastName,
		imageUrl: user.imageUrl,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
	};
}
