import type { UserDeleteResponse } from "shared";

import { useDelete } from "@/services/useDelete";
import { ENDPOINT } from "./constants";

export function useDeleteUser() {
	return useDelete<UserDeleteResponse>(ENDPOINT, ["users"]);
}
