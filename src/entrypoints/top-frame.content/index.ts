import { onMessage } from "@/shared/messaging";
import { ViewerHost } from "./viewer-host";

export default defineContentScript({
	// The styles go into the shadow root of the viewer, see ViewerHost.
	cssInjectionMode: "ui",
	main(ctx) {
		const viewerHost = new ViewerHost(ctx);

		onMessage("OPEN_VIEWER", ({ data: candidates }) => {
			if (viewerHost.isOpen) {
				alert(browser.i18n.getMessage("alert_dialog@already_open"));
				return;
			}

			void viewerHost.open(candidates);
		});
	},
	matchAboutBlank: true,
	matches: ["<all_urls>"],
	matchOriginAsFallback: true,
	runAt: "document_start",
});
