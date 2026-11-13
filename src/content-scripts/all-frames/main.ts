import { MESSAGE_TYPE } from "@shared/constants";
import type { FindMediaCandidatesMessage } from "@shared/types";
import { collectMediaCandidates } from "./collect-media-candidates";
import { ContextMenuTracker } from "./context-menu-tracker";
import { findMediaElement } from "./find-media-element";

const contextMenuTracker = new ContextMenuTracker();
contextMenuTracker.init();

browser.runtime.onMessage.addListener(
	({ srcUrl, type }: FindMediaCandidatesMessage, _, sendResponse) => {
		if (type !== MESSAGE_TYPE.FIND_MEDIA_CANDIDATES) return;

		const { point } = contextMenuTracker;
		const media = point && findMediaElement(document, point, srcUrl);

		sendResponse(media && collectMediaCandidates(media, srcUrl));
	},
);
