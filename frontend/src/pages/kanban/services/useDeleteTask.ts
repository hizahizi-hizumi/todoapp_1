import type { DeleteTaskResponse } from "shared";

import { useDelete } from "@/services/useDelete";
import { ENDPOINT } from "./constants";

export function useDeleteTask() {
	return useDelete<DeleteTaskResponse>(ENDPOINT, [ENDPOINT]);
}
