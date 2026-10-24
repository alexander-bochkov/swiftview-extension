import type { FlipDirection } from "../../../types";
import type { ViewerState } from "../types";

export const flip = (
	state: ViewerState,
	direction: FlipDirection,
): ViewerState => {
	const { flipX, flipY, offsetX, offsetY } = state.image;

	return {
		...state,
		image: {
			...state.image,
			// `+ 0` turns -0 into 0.
			...(direction === "horizontal"
				? { flipX: flipX === 1 ? -1 : 1, offsetX: -offsetX + 0 }
				: { flipY: flipY === 1 ? -1 : 1, offsetY: -offsetY + 0 }),
		},
	};
};
