import type { User, UserDetailResponse } from "shared";

import { useDetail } from "@/services/useDetail";
import { ENDPOINT } from "./constants";

type Return = {
	user: User | undefined;
	isLoading: boolean;
	error: Error | null;
};

export function useUser(id: string): Return {
	const { data, isLoading, error } = useDetail<UserDetailResponse>(
		ENDPOINT,
		id,
	);

	return { user: data?.user, isLoading, error };
}
