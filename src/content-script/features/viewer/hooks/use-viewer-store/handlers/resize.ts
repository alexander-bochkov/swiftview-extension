import { ZERO_POINT } from "../constants";
import type { Size, ViewerState } from "../types";
import { getFitScale, getRotatedSize, normalizeSize } from "../utils";

export const resize = (state: ViewerState, size: Size): ViewerState => {
	const containerSize = normalizeSize(size);

	if (!containerSize || !state.naturalSize) return { ...state, containerSize };

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
