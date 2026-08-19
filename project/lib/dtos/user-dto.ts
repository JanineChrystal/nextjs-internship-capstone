import type { DbUser } from "@/lib/types/user";
import { decrypt, deterministicDecrypt } from "@/lib/utils/encryption";

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
		email: deterministicDecrypt(user.email) || user.email,
		firstName: decrypt(user.firstName) || user.firstName,
		lastName: decrypt(user.lastName) || user.lastName,
		imageUrl: user.imageUrl,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
	};
}
