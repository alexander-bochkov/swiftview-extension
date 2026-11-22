import type { Point } from "@/shared/types";
import type { ImageViewerState } from "../types";
import {
	clampOffset,
	getRotatedSize,
	getToggledScale,
	scaleSize,
	zoomOffset,
} from "../utils";

export const toggleZoom = (
	state: ImageViewerState,
	point: Point,
): ImageViewerState => {
	if (!state.containerSize) return state;

	const imageSize = getRotatedSize(state.naturalSize, state.rotation);

	const scale = getToggledScale(state.scale, imageSize, state.containerSize);
	const visualSize = scaleSize(imageSize, scale);

	const offset = zoomOffset(state.offset, point, scale / state.scale);

	return {
		...state,
		offset: clampOffset(offset, visualSize, state.containerSize),
		scale,
	};
};
