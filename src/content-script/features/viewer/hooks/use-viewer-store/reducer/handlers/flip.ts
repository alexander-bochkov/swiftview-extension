import type { FlipDirection } from "../../../../types";
import type { ViewerState } from "../../types";
import { getFitScale, getRotatedSize } from "./utils";

export const flip = (
	state: ViewerState,
	direction: FlipDirection,
): ViewerState => {
	if (
		!state.container.height ||
		!state.container.width ||
		!state.image.naturalHeight ||
		!state.image.naturalWidth
	) {
		return state;
	}

	const fitScale = getFitScale(
		getRotatedSize(
			{ height: state.image.naturalHeight, width: state.image.naturalWidth },
			state.image.rotation,
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
			scale: fitScale,
			...(direction === "horizontal"
				? { flipX: state.image.flipX === 1 ? -1 : 1 }
				: { flipY: state.image.flipY === 1 ? -1 : 1 }),
		},
	};
};
