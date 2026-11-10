import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json" with { type: "json" };

// crxjs's manifest type lacks `match_origin_as_fallback`. Declaring the array
// separately skips the excess-property check while the rest stays type-checked.
// crxjs keeps unknown keys when it rewrites content script entries.
const contentScripts = [
	{
		js: ["src/content-scripts/top-frame/main.ts"],
		match_about_blank: true,
		match_origin_as_fallback: true,
		matches: ["<all_urls>"],
		run_at: "document_start",
	},
	{
		all_frames: true,
		js: ["src/content-scripts/all-frames/main.ts"],
		match_about_blank: true,
		match_origin_as_fallback: true,
		matches: ["<all_urls>"],
		run_at: "document_start",
	},
];

export default defineManifest({
	background: {
		service_worker: "src/background/main.ts",
		type: "module",
	},
	content_scripts: contentScripts,
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
	minimum_chrome_version: "148",
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
