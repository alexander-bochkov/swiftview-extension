import { onMessage } from "@/shared/messaging";
import { ViewerHost } from "./viewer-host";

export default defineContentScript({
	cssInjectionMode: "manual",
	main() {
		const viewerHost = new ViewerHost();
		viewerHost.init();

		onMessage("openViewer", ({ data: candidates }) => {
			if (!viewerHost.isOpen) viewerHost.open(candidates);
		});
	},
	matchAboutBlank: true,
	matches: ["<all_urls>"],
	matchOriginAsFallback: true,
	runAt: "document_start",
});
