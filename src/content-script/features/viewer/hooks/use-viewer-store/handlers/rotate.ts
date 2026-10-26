import type { RotateDirection } from "../../../types";
import { ZERO_POINT } from "../constants";
import type { ViewerState } from "../types";
import { getFitScale, getRotatedSize } from "../utils";

const QUARTER_TURN = 90;

export const rotate = (
	state: ViewerState,
	direction: RotateDirection,
): ViewerState => {
	if (!state.containerSize || !state.naturalSize) return state;

	const step = direction === "right" ? QUARTER_TURN : -QUARTER_TURN;

	// A mirrored image turns the other way on screen, so the step is inverted
	// to keep the visual direction.
	const isMirrored = state.flip.x !== state.flip.y;

	const rotation = state.rotation + (isMirrored ? -step : step);

	return {
		...state,
		offset: ZERO_POINT,
		rotation,
		scale: getFitScale(
			getRotatedSize(state.naturalSize, rotation),
			state.containerSize,
		),
	};
};
