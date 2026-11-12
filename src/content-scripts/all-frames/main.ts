import { MESSAGE_TYPE } from "@shared/constants";
import type { FindMediaCandidatesMessage } from "@shared/types";
import { collectMediaCandidates } from "./collect-media-candidates";
import { ContextMenuTracker } from "./context-menu-tracker";
import { findContextMenuMediaElement } from "./find-context-menu-media-element";

const contextMenuTracker = new ContextMenuTracker();
contextMenuTracker.init();

browser.runtime.onMessage.addListener(
	({ srcUrl, type }: FindMediaCandidatesMessage, _, sendResponse) => {
		if (type !== MESSAGE_TYPE.FIND_MEDIA_CANDIDATES) return;

		const media = findContextMenuMediaElement(contextMenuTracker.point, srcUrl);
		sendResponse(media ? collectMediaCandidates(media, srcUrl) : null);
	},
);
