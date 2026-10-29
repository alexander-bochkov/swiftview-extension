import { defineManifest } from "@crxjs/vite-plugin";
import { version } from "./package.json";

export default defineManifest({
	content_scripts: [
		{
			js: ["src/content-script/main.ts"],
			matches: ["<all_urls>"],
			run_at: "document_start",
		},
	],
	default_locale: "en",
	description: "__MSG_extDescription__",
	homepage_url: "https://github.com/alexander-bochkov/swiftview-extension",
	icons: {
		"16": "icons/icon-16.png",
		"32": "icons/icon-32.png",
		"48": "icons/icon-48.png",
		"128": "icons/icon-128.png",
	},
	manifest_version: 3,
	minimum_chrome_version: "134",
	name: "__MSG_extName__",
	short_name: "SwiftView",
	version,
	web_accessible_resources: [
		{
			matches: ["<all_urls>"],
			resources: ["fonts/*.woff2"],
			use_dynamic_url: true,
		},
	],
});
