import react from "@vitejs/plugin-react";
import { defineProject } from "vitest/config";

export default defineProject({
	plugins: [react()],
	resolve: {
		alias: {
			"@": "/src",
			shared: "../shared/src",
		},
	},
	test: {
		name: "frontend",
		environment: "happy-dom",
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
		setupFiles: ["src/test/setup-msw.ts"],
		globals: true,
	},
});
