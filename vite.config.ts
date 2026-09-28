import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
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
	plugins: [react(), svgr()],
});
