import type { RotateDirection } from "../../../../types";
import type { ViewerState } from "../../types";
import { getFitScale } from "./utils";

const QUARTER_TURN = 90;

export const rotate = (
	state: ViewerState,
	direction: RotateDirection,
): ViewerState => {
	if (
		!state.container.height ||
		!state.container.width ||
		!state.image.height ||
		!state.image.width
	) {
		return state;
	}

	const step = direction === "right" ? QUARTER_TURN : -QUARTER_TURN;

	// A mirrored image turns the other way on screen, so the step is inverted
	// to keep the visual direction.
	const isMirrored = state.image.flipX !== state.image.flipY;

	const rotatedSize = {
		height: state.image.width,
		width: state.image.height,
	};

	const fitScale = getFitScale(rotatedSize, {
		height: state.container.height,
		width: state.container.width,
	});

	return {
		...state,
		image: {
			...state.image,
			...rotatedSize,
			offsetX: 0,
			offsetY: 0,
			rotation: state.image.rotation + (isMirrored ? -step : step),
			scale: fitScale,
		},
	};
};
