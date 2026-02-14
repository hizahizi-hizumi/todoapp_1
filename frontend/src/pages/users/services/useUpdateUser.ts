import type { UserUpdateRequest, UserUpdateResponse } from "shared";

import { useUpdate } from "@/services/useUpdate";
import { ENDPOINT } from "./constants";

export function useUpdateUser() {
	return useUpdate<UserUpdateResponse, UserUpdateRequest>(ENDPOINT, ["users"]);
}
