import type { User } from "shared";

import { NotFoundError } from "@/errors/not_found_error";
import { users } from "./_users";

export function detail_usecase(id: number): User {
	const user = users.find((u) => u.id === id);

	if (!user) {
		throw new NotFoundError(`User with id ${id} not found`);
	}

	return user;
}
