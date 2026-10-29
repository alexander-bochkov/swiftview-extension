import type { Point } from "../../../../../../shared/types";
import type { ViewerState } from "../types";
import { clampOffset, getRotatedSize, scaleSize } from "../utils";

export const moveBy = (state: ViewerState, delta: Point): ViewerState => {
	if (!state.containerSize || !state.naturalSize) return state;

	const visualSize = scaleSize(
		getRotatedSize(state.naturalSize, state.rotation),
		state.scale,
	);

	const clamped = clampOffset(
		{ x: state.offset.x + delta.x, y: state.offset.y + delta.y },
		visualSize,
		state.containerSize,
	);

	if (state.offset.x === clamped.x && state.offset.y === clamped.y) {
		return state;
	}

	return {
		...state,
		offset: clamped,
	};
};
