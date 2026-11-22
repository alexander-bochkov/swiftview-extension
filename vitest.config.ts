import svgr from "vite-plugin-svgr";
import { configDefaults, defineConfig } from "vitest/config";
import { WxtVitest } from "wxt/testing/vitest-plugin";

export default defineConfig({
	plugins: [svgr(), WxtVitest()],
	test: {
		clearMocks: true,
		environment: "jsdom",
		// Snapshots of earlier code, kept for reference and not maintained.
		exclude: [...configDefaults.exclude, ".experiments/**"],
		forceRerunTriggers: [
			...configDefaults.forceRerunTriggers,
			"**/package-lock.json",
			"**/wxt.config.*",
		],
		setupFiles: ["vitest.setup.ts"],
		unstubGlobals: true,
	},
});
