import { onMessage } from "@/shared/messaging";
import { ViewerHost } from "./viewer-host";

export default defineContentScript({
	// The styles go into the shadow root of the viewer, see ViewerHost.
	cssInjectionMode: "ui",
	main(ctx) {
		const viewerHost = new ViewerHost(ctx);
		viewerHost.init();

		onMessage("openViewer", ({ data: candidates }) => {
			if (!viewerHost.isOpen) void viewerHost.open(candidates);
		});
	},
	matchAboutBlank: true,
	matches: ["<all_urls>"],
	matchOriginAsFallback: true,
	runAt: "document_start",
});
