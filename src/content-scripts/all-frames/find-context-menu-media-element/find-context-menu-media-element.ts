import type { Nullable, Point } from "@shared/types";

export type MediaElement = HTMLImageElement | HTMLVideoElement;

const isMediaElement = (el: Element): el is MediaElement =>
	el instanceof HTMLImageElement || el instanceof HTMLVideoElement;

const hasUrl = (media: MediaElement, url: string): boolean =>
	media.currentSrc === url || media.src === url;

export const findContextMenuMediaElement = (
	point: Nullable<Point>,
	srcUrl: string,
): Nullable<MediaElement> => {
	if (!point) return null;

	return (
		document
			.elementsFromPoint(point.x, point.y)
			.find(
				(el): el is MediaElement => isMediaElement(el) && hasUrl(el, srcUrl),
			) ?? null
	);
};
