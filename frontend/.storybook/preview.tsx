import type { Preview } from "@storybook/react";
import { ConfigProvider } from "antd";

import { withMockRouter } from "./decorators/withMockRouter";

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
	decorators: [
		withMockRouter,
		(Story) => (
			<ConfigProvider>
				<Story />
			</ConfigProvider>
		),
	],
};

export default preview;
