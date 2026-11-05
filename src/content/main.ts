import { MESSAGE_TYPE } from "@shared/constants";
import type { OpenImageMessage } from "@shared/types";
import { PageLock } from "./page-lock";
import { ScrollbarHider } from "./scrollbar-hider";
import { ViewerHost } from "./viewer-host";

const viewerHost = new ViewerHost(new PageLock(new ScrollbarHider()));

browser.runtime.onMessage.addListener(({ type, url }: OpenImageMessage) => {
	if (type !== MESSAGE_TYPE.OPEN_IMAGE || viewerHost.isOpen) return;

	viewerHost.open(url);
});
