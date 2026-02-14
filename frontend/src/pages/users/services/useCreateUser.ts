import type { UserCreateRequest, UserCreateResponse } from "shared";

import { useCreate } from "@/services/useCreate";
import { ENDPOINT } from "./constants";

export function useCreateUser() {
	return useCreate<UserCreateResponse, UserCreateRequest>(ENDPOINT, ["users"]);
}
