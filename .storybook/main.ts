import type { StorybookConfig } from "@storybook/react-vite";
import svgr from "vite-plugin-svgr";

export default {
	core: {
		disableTelemetry: true,
	},
	framework: "@storybook/react-vite",
	// The files of the extension, such as the font, served from the root, as
	// they are in the extension.
	staticDirs: ["../public"],
	stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	// WXT keeps its Vite config to itself, so the parts the components need are
	// added here.
	viteFinal: (config) => ({
		...config,
		plugins: [...(config.plugins ?? []), svgr()],
		resolve: { ...config.resolve, tsconfigPaths: true },
	}),
} satisfies StorybookConfig;
