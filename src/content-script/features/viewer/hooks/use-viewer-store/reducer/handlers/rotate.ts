import type { RotateDirection } from "../../../../types";
import type { ViewerState } from "../../types";
import { getFitScale, getRotatedSize } from "./utils";

const QUARTER_TURN = 90;

export const rotate = (
	state: ViewerState,
	direction: RotateDirection,
): ViewerState => {
	if (
		!state.container.height ||
		!state.container.width ||
		!state.image.naturalHeight ||
		!state.image.naturalWidth
	) {
		return state;
	}

	const step = direction === "right" ? QUARTER_TURN : -QUARTER_TURN;

	// A mirrored image turns the other way on screen, so the step is inverted
	// to keep the visual direction.
	const isMirrored = state.image.flipX !== state.image.flipY;

	const rotation = state.image.rotation + (isMirrored ? -step : step);

	const fitScale = getFitScale(
		getRotatedSize(
			{ height: state.image.naturalHeight, width: state.image.naturalWidth },
			rotation,
		),
		{
			height: state.container.height,
			width: state.container.width,
		},
	);

	return {
		...state,
		image: {
			...state.image,
			offsetX: 0,
			offsetY: 0,
			rotation,
			scale: fitScale,
		},
	};
};
