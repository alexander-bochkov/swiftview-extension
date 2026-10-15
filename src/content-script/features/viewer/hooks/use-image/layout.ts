import type { Point } from "@shared/types";
import type { Zoom } from "../use-viewer-store";

export type Size = {
	readonly height: number;
	readonly width: number;
};

// Relative to the natural size.
export const MAX_SCALE = 4;

export const getFitScale = (image: Size, container: Size): number => {
	const scaleX = container.width / image.width;
	const scaleY = container.height / image.height;

	return Math.min(scaleX, scaleY, 1);
};

export const getVisualSize = (size: Size, isSideways: boolean): Size => {
	const height = isSideways ? size.width : size.height;
	const width = isSideways ? size.height : size.width;

	return { height, width };
};

const scaleSize = ({ height, width }: Size, scale: number): Size => ({
	height: height * scale,
	width: width * scale,
});

// An image larger than the container may move only until its edge reaches
// the border of the container. A smaller one stays centered.
const clampAxis = (offset: number, size: number, container: number): number => {
	const limit = Math.max(0, (size - container) / 2);

	// `+ 0` turns -0 into 0.
	return Math.min(Math.max(offset, -limit), limit) + 0;
};

export const clampOffset = (
	offset: Point,
	size: Size,
	container: Size,
): Point => ({
	x: clampAxis(offset.x, size.width, container.width),
	y: clampAxis(offset.y, size.height, container.height),
});

type ZoomAtOptions = {
	readonly container: Size;
	// The visual size of the image at the natural scale.
	readonly image: Size;
	// From the center of the container.
	readonly point: Point;
	readonly scale: number;
	readonly zoom: Zoom;
};

// Scales the image so that the point of the image under `point` stays there,
// as far as the edges allow.
export const zoomAt = ({
	container,
	image,
	point,
	scale,
	zoom,
}: ZoomAtOptions): Zoom => {
	const ratio = scale / zoom.scale;

	const offset = {
		x: point.x - (point.x - zoom.offset.x) * ratio,
		y: point.y - (point.y - zoom.offset.y) * ratio,
	};

	return {
		offset: clampOffset(offset, scaleSize(image, scale), container),
		scale,
	};
};
