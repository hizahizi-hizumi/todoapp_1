import { useQuery } from "@tanstack/react-query";

type Return<TData> = {
	data: TData | undefined;
	isLoading: boolean;
	error: Error | null;
};

export function useGet<TData>(
	path: string,
	queryFn: () => Promise<TData>,
): Return<TData> {
	const { data, isLoading, error } = useQuery({
		queryKey: [path],
		queryFn: queryFn,
	});

	return { data: data, isLoading, error };
}
