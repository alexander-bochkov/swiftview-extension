import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json" with { type: "json" };

export default defineManifest({
	background: {
		service_worker: "src/background/main.ts",
		type: "module",
	},
	content_scripts: [
		{
			js: ["src/content/main.ts"],
			match_about_blank: true,
			matches: ["<all_urls>"],
			run_at: "document_start",
		},
	],
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
	manifest_version: 3,
	minimum_chrome_version: "134",
	name: "__MSG_extension@name__",
	permissions: ["contextMenus", "scripting"],
	short_name: "SwiftView",
	version: pkg.version,
	web_accessible_resources: [
		{
			matches: ["<all_urls>"],
			resources: ["fonts/*.woff2"],
			use_dynamic_url: true,
		},
	],
});
