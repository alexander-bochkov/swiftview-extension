import react from "@vitejs/plugin-react";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import svgr from "vite-plugin-svgr";
import { defineConfig } from "wxt";

export default defineConfig({
	hooks: {
		// WXT builds each entrypoint separately, and the plugin fails a build
		// with no CSS to inject, so it's added to the top frame's build only.
		"vite:build:extendConfig": (entrypoints, viteConfig) => {
			if (!entrypoints.some(({ name }) => name === "top-frame")) return;

			viteConfig.plugins ??= [];
			viteConfig.plugins.push(cssInjectedByJsPlugin());
		},
	},
	manifest: {
		default_locale: "en",
		description: "__MSG_extension@description__",
		homepage_url: "https://github.com/alexander-bochkov/swiftview-extension",
		host_permissions: ["<all_urls>"],
		icons: {
			"16": "icons/icon-16.png",
			"32": "icons/icon-32.png",
			"48": "icons/icon-48.png",
			"128": "icons/icon-128.png",
		},
		minimum_chrome_version: "148",
		name: "__MSG_extension@name__",
		permissions: ["contextMenus", "scripting", "tabs"],
		short_name: "SwiftView",
		web_accessible_resources: [
			{
				matches: ["<all_urls>"],
				resources: ["fonts/*.woff2"],
				use_dynamic_url: true,
			},
		],
	},
	srcDir: "src",
	vite: () => ({
		build: {
			target: "chrome148",
		},
		plugins: [react(), svgr()],
	}),
});
