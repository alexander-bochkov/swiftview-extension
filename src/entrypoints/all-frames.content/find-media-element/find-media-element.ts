import type { MediaElement, Nullable, Point } from "@/shared/types";

const isMediaElement = (el: Element): el is MediaElement =>
	el instanceof HTMLImageElement || el instanceof HTMLVideoElement;

const hasUrl = (media: MediaElement, url: string): boolean =>
	media.currentSrc === url || media.src === url;

const getShadowRoot = (el: Element): Nullable<ShadowRoot> =>
	el instanceof HTMLElement ? browser.dom.openOrClosedShadowRoot(el) : null;

export const findMediaElement = (
	root: DocumentOrShadowRoot,
	point: Point,
	srcUrl: string,
): Nullable<MediaElement> => {
	for (const el of root.elementsFromPoint(point.x, point.y)) {
		if (isMediaElement(el) && hasUrl(el, srcUrl)) return el;

		const shadowRoot = getShadowRoot(el);
		const media = shadowRoot && findMediaElement(shadowRoot, point, srcUrl);

		if (media) return media;
	}

	return null;
};
