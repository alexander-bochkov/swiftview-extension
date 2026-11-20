import svgr from "vite-plugin-svgr";
import { configDefaults, defineConfig } from "vitest/config";
import { WxtVitest } from "wxt/testing/vitest-plugin";

export default defineConfig({
	// WxtVitest doesn't add the Vite plugins from wxt.config.ts.
	plugins: [WxtVitest(), svgr()],
	test: {
		environment: "jsdom",
		// Snapshots of earlier code, kept for reference and not maintained.
		exclude: [...configDefaults.exclude, ".experiments/**"],
		setupFiles: ["vitest.setup.ts"],
	},
});
