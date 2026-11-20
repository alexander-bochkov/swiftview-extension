import type { MediaElement, Optional, Point } from "@/shared/types";

const isMediaElement = (el: Element): el is MediaElement =>
	el instanceof HTMLImageElement || el instanceof HTMLVideoElement;

const hasUrl = (media: MediaElement, url: string): boolean =>
	media.currentSrc === url || media.src === url;

export const findMediaElement = (
	root: DocumentOrShadowRoot,
	point: Point,
	srcUrl: string,
): Optional<MediaElement> => {
	for (const el of root.elementsFromPoint(point.x, point.y)) {
		if (isMediaElement(el) && hasUrl(el, srcUrl)) return el;

		const shadowRoot =
			el instanceof HTMLElement && browser.dom.openOrClosedShadowRoot(el);
		if (!shadowRoot) continue;

		const media = findMediaElement(shadowRoot, point, srcUrl);
		if (media) return media;
	}
};
