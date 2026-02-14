import type { CreateTaskRequest, CreateTaskResponse } from "shared";

import { useCreate } from "@/services/useCreate";
import { ENDPOINT } from "./constants";

export function useCreateTask() {
	return useCreate<CreateTaskResponse, CreateTaskRequest>(ENDPOINT, [ENDPOINT]);
}
