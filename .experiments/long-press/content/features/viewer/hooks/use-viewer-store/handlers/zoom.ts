import { MAX_SCALE } from "../constants";
import type { ViewerState, ZoomPayload } from "../types";
import {
	clampOffset,
	getFitScale,
	getRotatedSize,
	scaleSize,
	zoomOffset,
} from "../utils";

export const zoom = (
	state: ViewerState,
	{ factor, point }: ZoomPayload,
): ViewerState => {
	if (!state.containerSize || !state.naturalSize) return state;

	const imageSize = getRotatedSize(state.naturalSize, state.rotation);

	const fitScale = getFitScale(imageSize, state.containerSize);
	const scale = Math.min(Math.max(fitScale, state.scale * factor), MAX_SCALE);

	if (scale === state.scale) return state;

	const offset = zoomOffset(state.offset, point, scale / state.scale);

	return {
		...state,
		offset: clampOffset(
			offset,
			scaleSize(imageSize, scale),
			state.containerSize,
		),
		scale,
	};
};
