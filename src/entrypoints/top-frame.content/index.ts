import { MESSAGE_TYPE } from "@/shared/constants";
import type { Message } from "@/shared/types";
import { ViewerHost } from "./viewer-host";

export default defineContentScript({
	cssInjectionMode: "manual",
	main() {
		const viewerHost = new ViewerHost();
		viewerHost.init();

		browser.runtime.onMessage.addListener((message: Message) => {
			if (message.type !== MESSAGE_TYPE.OPEN_VIEWER || viewerHost.isOpen) {
				return;
			}

			viewerHost.open(message.candidates);
		});
	},
	matchAboutBlank: true,
	matches: ["<all_urls>"],
	matchOriginAsFallback: true,
	runAt: "document_start",
});
