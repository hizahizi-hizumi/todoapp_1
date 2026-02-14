import {
	type UseMutationResult,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";

type Return<TData, TVariables> = UseMutationResult<TData, Error, TVariables>;

export function useMutate<TData, TVariables>(
	mutationFn: (variables: TVariables) => Promise<TData>,
	invalidateKeys?: string[],
): Return<TData, TVariables> {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn,
		onSuccess: () => {
			if (invalidateKeys) {
				for (const key of invalidateKeys) {
					queryClient.invalidateQueries({ queryKey: [key] });
				}
			}
		},
	});
}
