import type { Point } from "@shared/types";
import { MAX_SCALE, NATURAL_SIZE_SCALE } from "./constants";
import type { Size } from "./types";

export const clampOffset = (offset: Point, content: Size, container: Size) => {
	const clampAxis = (
		offset: number,
		content: number,
		container: number,
	): number => {
		const limit = Math.max(0, (content - container) / 2);
		// `+ 0` turns -0 into 0.
		return Math.min(Math.max(-limit, offset), limit) + 0;
	};

	return {
		offsetX: clampAxis(offset.x, content.width, container.width),
		offsetY: clampAxis(offset.y, content.height, container.height),
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

export const getRotatedSize = (natural: Size, rotation: number): Size =>
	rotation % 180 === 0
		? natural
		: { height: natural.width, width: natural.height };

export const scaleSize = ({ height, width }: Size, scale: number): Size => ({
	height: height * scale,
	width: width * scale,
});

export const zoomOffset = (offset: Point, point: Point, ratio: number) => ({
	x: point.x - (point.x - offset.x) * ratio,
	y: point.y - (point.y - offset.y) * ratio,
});
