import {
	type UseMutationResult,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";

import { env } from "@/config/env";

type Return<TData, TVariables> = UseMutationResult<TData, Error, TVariables>;

export function useCreate<TData, TVariables>(
	path: string,
	invalidateKeys?: string[],
): Return<TData, TVariables> {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (variables: TVariables): Promise<TData> => {
			const response = await fetch(`${env.apiUrl}/${path}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(variables),
			});

			if (!response.ok) {
				throw new Error(`Failed to create ${path}`);
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
