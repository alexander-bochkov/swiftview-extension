import { MESSAGE_TYPE } from "@shared/constants";
import type { OpenImageMessage } from "@shared/types";
import { PageLock, ScrollbarHider, ViewerHost } from "./features";

const viewerHost = new ViewerHost(new PageLock(new ScrollbarHider()));

chrome.runtime.onMessage.addListener(({ type, url }: OpenImageMessage) => {
	if (type !== MESSAGE_TYPE.OPEN_IMAGE || viewerHost.isOpen) return;

	viewerHost.open(url);
});
