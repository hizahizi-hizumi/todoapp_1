import {
	type UseMutationResult,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";

import { env } from "@/config/env";

type Return<TData> = UseMutationResult<TData, Error, string>;

export function useDelete<TData>(
	path: string,
	invalidateKeys?: string[],
): Return<TData> {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string): Promise<TData> => {
			const response = await fetch(`${env.apiUrl}/${path}/${id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error(`Failed to delete ${path}/${id}`);
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
