import { defineProject } from "vitest/config";

export default defineProject({
	resolve: {
		alias: {
			"@": "/src",
			shared: "../shared/src",
		},
	},
	test: {
		name: "backend",
		environment: "node",
		include: ["src/**/*.{test,spec}.ts"],
		globals: true,
	},
});
