import type { FlipDirection } from "../../../types";
import type { ViewerState } from "../types";

const AXIS = {
	horizontal: "x",
	vertical: "y",
} as const satisfies Record<FlipDirection, keyof ViewerState["flip"]>;

export const flip = (
	state: ViewerState,
	direction: FlipDirection,
): ViewerState => {
	const axis = AXIS[direction];

	return {
		...state,
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
