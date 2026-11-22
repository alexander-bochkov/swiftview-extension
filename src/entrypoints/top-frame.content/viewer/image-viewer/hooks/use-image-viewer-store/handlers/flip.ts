import type { FlipDirection } from "../../../types";
import type { ImageViewerState } from "../types";

const AXIS = {
	horizontal: "x",
	vertical: "y",
} as const satisfies Record<FlipDirection, keyof ImageViewerState["flip"]>;

export const flip = (
	state: ImageViewerState,
	direction: FlipDirection,
): ImageViewerState => {
	const axis = AXIS[direction];

	return {
		...state,
		blockingTransition: { phase: "settling" },
		flip: {
			...state.flip,
			[axis]: state.flip[axis] === 1 ? -1 : 1,
		},
		offset: {
			...state.offset,
			[axis]: -state.offset[axis],
		},
	};
};
