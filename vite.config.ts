import react from "@vitejs/plugin-react";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import svgr from "vite-plugin-svgr";
import { defineConfig } from "vitest/config";

export default defineConfig({
	build: {
		rolldownOptions: {
			input: {
				"content-script": "src/content-script/main.ts",
			},
			output: {
				entryFileNames: "[name].js",
			},
		},
		target: "chrome134",
	},
	plugins: [cssInjectedByJsPlugin(), react(), svgr()],
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		environment: "jsdom",
	},
});
