import { defineConfig } from "vite";

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
});
