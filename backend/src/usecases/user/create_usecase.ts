import type { User } from "shared";

import { users } from "./_users";

export function create_usecase(name: string, email: string): User {
	const newId = Math.max(...users.map((u) => u.id)) + 1;

	const newUser: User = {
		id: newId,
		name,
		email,
	};

	users.push(newUser);

	return newUser;
}
