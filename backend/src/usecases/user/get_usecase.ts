import type { User } from "shared";

import { users } from "./_users";

export function get_usecase(): User[] {
	return users;
}
