import type { Point } from "@/shared/types";
import type { ImageViewerState } from "../types";
import { clampOffset, getRotatedSize, scaleSize } from "../utils";

export const moveBy = (
	state: ImageViewerState,
	delta: Point,
): ImageViewerState => {
	if (!state.containerSize) return state;

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
