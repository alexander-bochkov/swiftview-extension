import { MEDIA_TYPE, MESSAGE_TYPE } from "@shared/constants";
import type { MediaCandidate, OpenViewerMessage } from "@shared/types";
import { ViewerHost } from "./viewer-host";

const viewerHost = new ViewerHost();
viewerHost.init();

const isImage = ({ type }: MediaCandidate): boolean =>
	type === MEDIA_TYPE.IMAGE;

browser.runtime.onMessage.addListener(
	({ candidates, type }: OpenViewerMessage) => {
		if (type !== MESSAGE_TYPE.OPEN_VIEWER || viewerHost.isOpen) return;

		// TODO: let the viewer try the candidates in order. Until it plays video,
		// it shows the first image, or fails on the first candidate without one.
		const media = candidates.find(isImage) ?? candidates[0];

		if (media) viewerHost.open(media.url);
	},
);
