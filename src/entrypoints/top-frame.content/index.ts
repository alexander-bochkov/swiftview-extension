import { onMessage } from "@/shared/messaging";
import { Viewer } from "./viewer";
import { ViewerHost } from "./viewer-host";

export default defineContentScript({
	cssInjectionMode: "ui",
	main(ctx) {
		const viewerHost = new ViewerHost(ctx, Viewer);

		onMessage("OPEN_VIEWER", ({ data: candidates }) => {
			if (viewerHost.isOpen) {
				alert(browser.i18n.getMessage("alert_dialog@already_open"));
				return;
			}

			viewerHost.open(candidates);
		});
	},
	matchAboutBlank: true,
	matches: ["<all_urls>"],
	matchOriginAsFallback: true,
	runAt: "document_start",
});
