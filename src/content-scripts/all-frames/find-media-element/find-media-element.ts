import type { MediaElement, Nullable, Point } from "@shared/types";

const isMediaElement = (el: Element): el is MediaElement =>
	el instanceof HTMLImageElement || el instanceof HTMLVideoElement;

const hasUrl = (media: MediaElement, url: string): boolean =>
	media.currentSrc === url || media.src === url;

const getShadowRoot = (element: Element): Nullable<ShadowRoot> =>
	element instanceof HTMLElement
		? browser.dom.openOrClosedShadowRoot(element)
		: null;

export const findMediaElement = (
	root: DocumentOrShadowRoot,
	point: Point,
	srcUrl: string,
): Nullable<MediaElement> => {
	for (const element of root.elementsFromPoint(point.x, point.y)) {
		if (isMediaElement(element) && hasUrl(element, srcUrl)) return element;

		const shadowRoot = getShadowRoot(element);
		const media = shadowRoot && findMediaElement(shadowRoot, point, srcUrl);

		if (media) return media;
	}

	return null;
};
