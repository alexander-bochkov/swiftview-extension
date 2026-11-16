import { MESSAGE_TYPE } from "@shared/constants";
import type { Message } from "@shared/types";
import { collectMediaCandidates } from "./collect-media-candidates";
import { ContextMenuTracker } from "./context-menu-tracker";
import { findMediaElement } from "./find-media-element";

const contextMenuTracker = new ContextMenuTracker();
contextMenuTracker.init();

browser.runtime.onMessage.addListener((message: Message, _, sendResponse) => {
	if (message.type !== MESSAGE_TYPE.FIND_MEDIA_CANDIDATES) return;

	const { point } = contextMenuTracker;
	const media = point && findMediaElement(document, point, message.srcUrl);

	sendResponse(media && collectMediaCandidates(media, message.srcUrl));
});
