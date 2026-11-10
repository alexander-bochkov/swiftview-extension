import { MESSAGE_TYPE } from "@shared/constants";
import type { OpenImageMessage } from "@shared/types";
import { ViewerHost } from "./viewer-host";

const viewerHost = new ViewerHost();

// The script runs at document_start, before the scripts of the page.
viewerHost.init();

browser.runtime.onMessage.addListener(({ type, url }: OpenImageMessage) => {
	if (type !== MESSAGE_TYPE.OPEN_IMAGE || viewerHost.isOpen) return;

	viewerHost.open(url);
});
