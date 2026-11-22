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
		setupFiles: ["vitest.setup.ts"],
		unstubGlobals: true,
	},
});
