import { MESSAGE_TYPE } from "@shared/constants";
import type { FindBestMediaUrlMessage } from "@shared/types";
import { ContextMenuTracker } from "./context-menu-tracker";
import { findBestImageUrl } from "./find-best-image-url";

const contextMenuTracker = new ContextMenuTracker();
contextMenuTracker.init();

browser.runtime.onMessage.addListener(
	({ type }: FindBestMediaUrlMessage, _, sendResponse) => {
		if (type !== MESSAGE_TYPE.FIND_BEST_MEDIA_URL) return;

		sendResponse(findBestImageUrl(contextMenuTracker.point));
	},
);
