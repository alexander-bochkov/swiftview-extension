import type { StorybookConfig } from "@storybook/react-vite";
import svgr from "vite-plugin-svgr";

export default {
	core: {
		disableTelemetry: true,
	},
	framework: "@storybook/react-vite",
	// Served by Storybook, not by Vite: Vite warns about the import of a public
	// file, and the fake browser imports the messages from public/_locales.
	staticDirs: ["../public"],
	stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	// WXT keeps its Vite config to itself, so the parts the components need are
	// added here.
	viteFinal: (config) => ({
		...config,
		plugins: [...(config.plugins ?? []), svgr()],
		publicDir: false,
		resolve: { ...config.resolve, tsconfigPaths: true },
	}),
} satisfies StorybookConfig;
