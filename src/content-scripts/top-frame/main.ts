import { MESSAGE_TYPE } from "@shared/constants";
import type { OpenViewerMessage } from "@shared/types";
import { ViewerHost } from "./viewer-host";

const viewerHost = new ViewerHost();
viewerHost.init();

browser.runtime.onMessage.addListener(
	({ candidates, type }: OpenViewerMessage) => {
		if (type !== MESSAGE_TYPE.OPEN_VIEWER || viewerHost.isOpen) return;

		viewerHost.open(candidates);
	},
);
