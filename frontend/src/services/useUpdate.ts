import {
	type UseMutationResult,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";

import { env } from "@/config/env";

type Return<TData, TVariables> = UseMutationResult<TData, Error, TVariables>;

type UpdateVariables<TVariables> = {
	id: string;
	data: TVariables;
};

export function useUpdate<TData, TVariables>(
	path: string,
	invalidateKeys?: string[],
): Return<TData, UpdateVariables<TVariables>> {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			variables: UpdateVariables<TVariables>,
		): Promise<TData> => {
			const response = await fetch(`${env.apiUrl}/${path}/${variables.id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(variables.data),
			});

			if (!response.ok) {
				throw new Error(`Failed to update ${path}/${variables.id}`);
			}

			return response.json();
		},
		onSuccess: () => {
			if (invalidateKeys) {
				for (const key of invalidateKeys) {
					queryClient.invalidateQueries({ queryKey: [key] });
				}
			}
		},
	});
}
