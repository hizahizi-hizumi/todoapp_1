import type { UpdateTaskRequest, UpdateTaskResponse } from "shared";

import { useUpdate } from "@/services/useUpdate";
import { ENDPOINT } from "./constants";

export function useUpdateTask() {
	return useUpdate<UpdateTaskResponse, UpdateTaskRequest>(ENDPOINT, [ENDPOINT]);
}
