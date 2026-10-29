import type { Nullable, Point } from "../../../../../shared/types";
import { MAX_SCALE, NATURAL_SIZE_SCALE } from "./constants";
import type { Size } from "./types";

export const getOffsetLimit = (content: Size, container: Size): Point => ({
	x: Math.max(0, (content.width - container.width) / 2),
	y: Math.max(0, (content.height - container.height) / 2),
});

export const clampOffset = (
	offset: Point,
	content: Size,
	container: Size,
): Point => {
	const limit = getOffsetLimit(content, container);

	return {
		x: Math.min(Math.max(-limit.x, offset.x), limit.x),
		y: Math.min(Math.max(-limit.y, offset.y), limit.y),
	};
};

export const getFitScale = (
	content: Size,
	container: Size,
	// The image is never scaled above `maxScale`, by default its natural size.
	maxScale = NATURAL_SIZE_SCALE,
): number => {
	const scaleX = container.width / content.width;
	const scaleY = container.height / content.height;

	return Math.min(maxScale, scaleX, scaleY);
};

export const getToggledScale = (
	scale: number,
	content: Size,
	container: Size,
): number => {
	const fitScale = getFitScale(content, container);

	// A small image toggles between the natural size and filling the container.
	if (fitScale === NATURAL_SIZE_SCALE && scale === NATURAL_SIZE_SCALE) {
		return getFitScale(content, container, MAX_SCALE);
	}

	// A large image toggles between the fitted and the natural size. A zoom
	// above the natural size returns to it, and one below it to the fitted
	// size.
	return scale === fitScale || scale > NATURAL_SIZE_SCALE
		? NATURAL_SIZE_SCALE
		: fitScale;
};

export const getRotatedSize = (size: Size, rotation: number): Size =>
	rotation % 180 === 0 ? size : { height: size.width, width: size.height };

export const normalizeSize = (size: Size): Nullable<Size> =>
	size.height && size.width ? size : null;

export const scaleSize = ({ height, width }: Size, scale: number): Size => ({
	height: height * scale,
	width: width * scale,
});

export const zoomOffset = (
	offset: Point,
	point: Point,
	ratio: number,
): Point => ({
	x: point.x - (point.x - offset.x) * ratio,
	y: point.y - (point.y - offset.y) * ratio,
});
