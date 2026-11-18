import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { defineConfig } from "wxt";

export default defineConfig({
	hooks: {
		// WXT gives its runner the config of the first start only, and
		// web-ext takes the start url out of the list it gets, so "o + enter"
		// would open about:blank. The runner's config field is internal to WXT,
		// so check "o + enter" after updating WXT.
		"config:resolved": (wxt) => {
			Reflect.set(wxt.runner, "config", wxt.config);
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
	webExt: {
		// web-ext adds --disable-blink-features=AutomationControlled, so sites
		// don't take the browser for a bot. Chrome warns about the flag in a
		// bar above every page, unless it runs as a test.
		chromiumArgs: ["--test-type"],
		// The test page, as a file url resolved from this file.
		startUrls: [new URL("test-pages/index.html", import.meta.url).href],
	},
});
