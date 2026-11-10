import { MESSAGE_TYPE } from "@shared/constants";
import type { FindBestMediaUrlMessage } from "@shared/types";
import { ContextMenuTracker } from "./context-menu-tracker";
import { findBestImageUrl } from "./find-best-image-url";
import { findMenuImage } from "./find-menu-image";

const contextMenuTracker = new ContextMenuTracker();
contextMenuTracker.init();

browser.runtime.onMessage.addListener(
	({ srcUrl, type }: FindBestMediaUrlMessage, _, sendResponse) => {
		if (type !== MESSAGE_TYPE.FIND_BEST_MEDIA_URL) return;

		const image = findMenuImage(contextMenuTracker.point, srcUrl);

		sendResponse(image ? findBestImageUrl(image) : null);
	},
);
