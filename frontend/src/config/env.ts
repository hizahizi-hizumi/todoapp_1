const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
	throw new Error("VITE_API_URL is not defined in environment variables");
}

export const env = {
	apiUrl,
} as const;
