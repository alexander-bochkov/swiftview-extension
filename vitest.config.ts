import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import svgr from "vite-plugin-svgr";
import { configDefaults, defineConfig } from "vitest/config";
import { WxtVitest } from "wxt/testing/vitest-plugin";

export default defineConfig({
	// WxtVitest doesn't add the Vite plugins from wxt.config.ts.
	plugins: [WxtVitest(), cssInjectedByJsPlugin(), svgr()],
	test: {
		environment: "jsdom",
		exclude: [
			...configDefaults.exclude,
			// Snapshots of earlier code, kept for reference and not maintained.
			".experiments/**",
			// A copy of the code from before WXT, until it's deleted.
			".old/**",
		],
		setupFiles: ["vitest.setup.ts"],
	},
});
