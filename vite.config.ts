import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import svgr from "vite-plugin-svgr";
import { defineConfig } from "vitest/config";
import manifest from "./manifest.config.js";

export default defineConfig({
	build: {
		target: "chrome134",
	},
	plugins: [crx({ manifest }), cssInjectedByJsPlugin(), react(), svgr()],
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		environment: "jsdom",
		setupFiles: ["src/test-setup.ts"],
	},
});
