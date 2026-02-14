import type { GetTasksResponse, Task } from "shared";

import { env } from "@/config/env";
import { useGet } from "@/services/useGet";
import { ENDPOINT } from "./constants";

type Return = {
	tasks: Task[];
	isLoading: boolean;
	error: Error | null;
};

export function useTasks(): Return {
	const { data, isLoading, error } = useGet<GetTasksResponse>(
		ENDPOINT,
		async (): Promise<GetTasksResponse> => {
			const response = await fetch(`${env.apiUrl}/${ENDPOINT}`);

			if (!response.ok) {
				throw new Error(`Failed to fetch tasks: ${response.statusText}`);
			}

			return response.json();
		},
	);

	return { tasks: data?.tasks ?? [], isLoading, error };
}
