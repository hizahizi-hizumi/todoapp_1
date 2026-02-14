import { useQuery } from "@tanstack/react-query";

import { env } from "@/config/env";

type Return<TData> = {
	data: TData | undefined;
	isLoading: boolean;
	error: Error | null;
};

export function useDetail<TData>(path: string, id: string): Return<TData> {
	const { data, isLoading, error } = useQuery({
		queryKey: [path, id],
		queryFn: async (): Promise<TData> => {
			const response = await fetch(`${env.apiUrl}/${path}/${id}`);

			if (!response.ok) {
				throw new Error(`Failed to fetch ${path}/${id}`);
			}

			return response.json();
		},
	});

	return { data, isLoading, error };
}
