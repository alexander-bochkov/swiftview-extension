import { onMessage } from "@/shared/messaging";
import { collectMediaCandidates } from "./collect-media-candidates";
import { ContextMenuTracker } from "./context-menu-tracker";
import { findMediaElement } from "./find-media-element";

export default defineContentScript({
	allFrames: true,
	main() {
		const contextMenuTracker = new ContextMenuTracker();
		contextMenuTracker.init();

		onMessage("findMediaCandidates", ({ data: srcUrl }) => {
			const { point } = contextMenuTracker;
			const media = point && findMediaElement(document, point, srcUrl);

			return media && collectMediaCandidates(media, srcUrl);
		});
	},
	matchAboutBlank: true,
	matches: ["<all_urls>"],
	matchOriginAsFallback: true,
	runAt: "document_start",
});
