import type { Size, ViewerState } from "../types";
import { getFitScale, getRotatedSize, normalizeSize } from "../utils";
import { fail } from "./fail";

export const load = (state: ViewerState, size: Size): ViewerState => {
	const naturalSize = normalizeSize(size);

	// An image without a size, such as an SVG without its own size in some
	// browsers, can't be fitted or shown.
	if (!naturalSize) return fail(state);

	if (!state.containerSize) return { ...state, naturalSize };

	return {
		...state,
		naturalSize,
		scale: getFitScale(
			getRotatedSize(naturalSize, state.rotation),
			state.containerSize,
		),
	};
};
