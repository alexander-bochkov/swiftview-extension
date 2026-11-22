import { onMessage } from "@/shared/messaging";
import type { MediaElement, Optional } from "@/shared/types";
import { collectMediaCandidates } from "./collect-media-candidates";
import { ContextMenuTracker } from "./context-menu-tracker";
import { findMediaElement } from "./find-media-element";

export default defineContentScript({
	allFrames: true,
	main() {
		const contextMenuTracker = new ContextMenuTracker();
		contextMenuTracker.init();

		// The media of the last menu
		let media: Optional<MediaElement>;

		onMessage("FIND_MEDIA_CANDIDATES", ({ data: srcUrl }) => {
			const { point } = contextMenuTracker;
			media = point ? findMediaElement(document, point, srcUrl) : undefined;

			return media ? collectMediaCandidates(media, srcUrl) : null;
		});

		onMessage("PAUSE_MEDIA", () => {
			if (media instanceof HTMLVideoElement) media.pause();
		});
	},
	matchAboutBlank: true,
	matches: ["<all_urls>"],
	matchOriginAsFallback: true,
	runAt: "document_start",
});
