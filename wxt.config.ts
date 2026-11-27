import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { defineConfig } from "wxt";

export default defineConfig({
	hooks: {
		"build:publicAssets": (wxt, files) => {
			files.push({
				absoluteSrc: `${wxt.config.root}/LICENSE`,
				relativeDest: "LICENSE",
			});
		},
	},
	manifest: {
		default_locale: "en",
		description: "__MSG_extension_description__",
		homepage_url: "https://github.com/alexander-bochkov/swiftview-extension",
		host_permissions: ["<all_urls>"],
		icons: {
			"16": "icons/icon-16.png",
			"32": "icons/icon-32.png",
			"48": "icons/icon-48.png",
			"128": "icons/icon-128.png",
		},
		minimum_chrome_version: "148",
		name: "__MSG_extension_name__",
		permissions: ["contextMenus", "scripting", "storage", "tabs"],
		short_name: "SwiftView",
		web_accessible_resources: [
			{
				matches: ["<all_urls>"],
				resources: ["fonts/*.woff2"],
				use_dynamic_url: true,
			},
		],
	},
	modules: ["@wxt-dev/i18n/module"],
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
		// The test page, as a file url resolved from this file. A string, not
		// the array WXT types ask for: web-ext takes the first url out of an
		// array, and WXT passes the same one again on "o + enter", which then
		// opens about:blank. web-ext puts a string into a new array each time.
		startUrls: new URL("test-pages/index.html", import.meta.url)
			.href as unknown as string[],
	},
});
