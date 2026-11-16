import type { StorybookConfig } from "@storybook/react-vite";

export default {
	core: {
		disableTelemetry: true,
	},
	framework: "@storybook/react-vite",
	// Served by Storybook, not by Vite: Vite warns about the import of a public
	// file, and the fake browser imports the messages from public/_locales.
	staticDirs: ["../public"],
	stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	viteFinal: (config) => ({ ...config, publicDir: false }),
} satisfies StorybookConfig;
