import { NotFoundError } from "@/errors/not_found_error";
import { users } from "./_users";

export function delete_usecase(id: number): void {
	const index = users.findIndex((u) => u.id === id);

	if (index === -1) {
		throw new NotFoundError(`User with id ${id} not found`);
	}

	users.splice(index, 1);
}
