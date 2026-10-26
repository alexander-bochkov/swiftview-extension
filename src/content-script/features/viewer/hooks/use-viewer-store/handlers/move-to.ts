import type { Point } from "@shared/types";
import type { ViewerState } from "../types";
import { clampOffset, getRotatedSize, scaleSize } from "../utils";

export const moveTo = (state: ViewerState, offset: Point): ViewerState => {
	if (!state.containerSize || !state.naturalSize) return state;

	const visualSize = scaleSize(
		getRotatedSize(state.naturalSize, state.rotation),
		state.scale,
	);

	const clamped = clampOffset(offset, visualSize, state.containerSize);

	if (state.offset.x === clamped.x && state.offset.y === clamped.y) {
		return state;
	}

	return {
		...state,
		offset: clamped,
	};
};
