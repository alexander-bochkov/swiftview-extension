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

	const rotatedSize = getRotatedSize(state.naturalSize, state.rotation);

	const scale = getToggledScale(state.scale, rotatedSize, state.containerSize);
	const displayedSize = scaleSize(rotatedSize, scale);

	const offset = zoomOffset(state.offset, point, scale / state.scale);

	return {
		...state,
		offset: clampOffset(offset, displayedSize, state.containerSize),
		scale,
	};
};
