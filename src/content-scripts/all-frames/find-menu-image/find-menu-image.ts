import type { Nullable, Point } from "@shared/types";

const hasUrl = (image: HTMLImageElement, url: string): boolean =>
	image.currentSrc === url || image.src === url;

// The image the menu was opened on: one under the point with the url of the
// menu. The point alone isn't enough, as a menu opened from the keyboard (the
// menu key or Shift+F10) reports one near the focused element, which may not
// be over the image. Null without a point, or when no image under it matches.
export const findMenuImage = (
	point: Nullable<Point>,
	srcUrl: string,
): Nullable<HTMLImageElement> => {
	if (!point) return null;

	return (
		document
			.elementsFromPoint(point.x, point.y)
			.find(
				(element): element is HTMLImageElement =>
					element instanceof HTMLImageElement && hasUrl(element, srcUrl),
			) ?? null
	);
};
