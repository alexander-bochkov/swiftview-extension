import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import svgr from "vite-plugin-svgr";

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
	},
	plugins: [cssInjectedByJsPlugin(), react(), svgr()],
	resolve: {
		tsconfigPaths: true,
	},
});
