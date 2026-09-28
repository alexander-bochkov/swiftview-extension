import type { StorybookConfig } from "@storybook/react-vite";

export default {
	core: {
		disableTelemetry: true,
	},
	framework: "@storybook/react-vite",
	stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
} satisfies StorybookConfig;
