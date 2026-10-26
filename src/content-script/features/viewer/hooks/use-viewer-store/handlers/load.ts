import type { Size, ViewerState } from "../types";
import { getFitScale, getRotatedSize, normalizeSize } from "../utils";

export const load = (state: ViewerState, size: Size): ViewerState => {
	const naturalSize = normalizeSize(size);

	if (!naturalSize || !state.containerSize) return { ...state, naturalSize };

	return {
		...state,
		naturalSize,
		scale: getFitScale(
			getRotatedSize(naturalSize, state.rotation),
			state.containerSize,
		),
	};
};
