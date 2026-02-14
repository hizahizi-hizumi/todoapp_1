import type { Meta, StoryObj } from "@storybook/react";

import { SampleButton } from "./SampleButton";

const meta = {
	title: "Components/SampleButton",
	component: SampleButton,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		type: {
			control: "select",
			options: ["default", "primary", "dashed", "link", "text"],
		},
		size: {
			control: "select",
			options: ["small", "middle", "large"],
		},
		danger: {
			control: "boolean",
		},
		disabled: {
			control: "boolean",
		},
	},
} satisfies Meta<typeof SampleButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
	args: {
		label: "Primary Button",
		type: "primary",
	},
};

export const Default: Story = {
	args: {
		label: "Default Button",
		type: "default",
	},
};

export const Dashed: Story = {
	args: {
		label: "Dashed Button",
		type: "dashed",
	},
};

export const Link: Story = {
	args: {
		label: "Link Button",
		type: "link",
	},
};

export const Text: Story = {
	args: {
		label: "Text Button",
		type: "text",
	},
};

export const Danger: Story = {
	args: {
		label: "Danger Button",
		type: "primary",
		danger: true,
	},
};

export const Disabled: Story = {
	args: {
		label: "Disabled Button",
		type: "primary",
		disabled: true,
	},
};

export const Large: Story = {
	args: {
		label: "Large Button",
		type: "primary",
		size: "large",
	},
};

export const Small: Story = {
	args: {
		label: "Small Button",
		type: "primary",
		size: "small",
	},
};
