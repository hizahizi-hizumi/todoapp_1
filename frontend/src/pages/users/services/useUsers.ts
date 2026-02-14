import type { User, UserGetResponse } from "shared";

import { env } from "@/config/env";
import { useGet } from "@/services/useGet";
import { ENDPOINT } from "./constants";

type Return = {
	users: User[];
	isLoading: boolean;
	error: Error | null;
};

export function useUsers(): Return {
	const { data, isLoading, error } = useGet<UserGetResponse>(
		"users",
		async (): Promise<UserGetResponse> => {
			const response = await fetch(`${env.apiUrl}/${ENDPOINT}`);

			if (!response.ok) {
				throw new Error(`Failed to fetch users: ${response.statusText}`);
			}

			return response.json();
		},
	);

	return { users: data?.users ?? [], isLoading, error };
}
