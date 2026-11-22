import { ZERO_POINT } from "../constants";
import type { ImageViewerState, Size } from "../types";
import { getFitScale, getRotatedSize, normalizeSize } from "../utils";

export const resize = (
	state: ImageViewerState,
	size: Size,
): ImageViewerState => {
	const containerSize = normalizeSize(size);

	if (!containerSize) return { ...state, containerSize };

	return {
		...state,
		containerSize,
		offset: ZERO_POINT,
		scale: getFitScale(
			getRotatedSize(state.naturalSize, state.rotation),
			containerSize,
		),
	};
};
