import {
	type UseMutationResult,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import type {
	GetTasksResponse,
	MoveTaskRequest,
	MoveTaskResponse,
} from "shared";

import { env } from "@/config/env";
import { ENDPOINT } from "./constants";

type MoveTaskVariables = {
	id: string;
	data: MoveTaskRequest;
};

type Return = UseMutationResult<MoveTaskResponse, Error, MoveTaskVariables>;

export function useMoveTask(): Return {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			variables: MoveTaskVariables,
		): Promise<MoveTaskResponse> => {
			const response = await fetch(
				`${env.apiUrl}/${ENDPOINT}/${variables.id}/move`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(variables.data),
				},
			);

			if (!response.ok) {
				throw new Error(`Failed to move task ${variables.id}`);
			}

			return response.json();
		},
		onMutate: async (variables: MoveTaskVariables) => {
			await queryClient.cancelQueries({ queryKey: [ENDPOINT] });

			const previousTasks = queryClient.getQueryData<GetTasksResponse>([
				ENDPOINT,
			]);

			queryClient.setQueryData<GetTasksResponse>([ENDPOINT], (old) => {
				if (!old) return old;

				const updatedTasks = old.tasks.map((task) =>
					task.id === variables.id
						? {
								...task,
								status: variables.data.status,
								order: variables.data.order,
							}
						: task,
				);

				return { tasks: updatedTasks };
			});

			return { previousTasks };
		},
		onError: (_error, _variables, context) => {
			if (context?.previousTasks) {
				queryClient.setQueryData<GetTasksResponse>(
					[ENDPOINT],
					context.previousTasks,
				);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
		},
	});
}
