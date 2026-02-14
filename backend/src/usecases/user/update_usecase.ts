import type { User } from "shared";

import { NotFoundError } from "@/errors/not_found_error";
import { users } from "./_users";

export function update_usecase(
	id: number,
	name?: string,
	email?: string,
): User {
	const user = users.find((u) => u.id === id);

	if (!user) {
		throw new NotFoundError(`User with id ${id} not found`);
	}

	if (name !== undefined) {
		user.name = name;
	}

	if (email !== undefined) {
		user.email = email;
	}

	return user;
}
