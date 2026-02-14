import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
	stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	addons: [
		"@storybook/addon-links",
		"@storybook/addon-essentials",
		"@storybook/addon-interactions",
	],
	framework: {
		name: "@storybook/react-vite",
		options: {},
	},
	core: {
		disableTelemetry: true,
	},
	viteFinal: async (config) => {
		const { mergeConfig } = await import("vite");
		const tsconfigPaths = (await import("vite-tsconfig-paths")).default;

		return mergeConfig(config, {
			plugins: [tsconfigPaths()],
		});
	},
};

export default config;
