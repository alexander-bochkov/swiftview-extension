import type { Point } from "@shared/types";
import type { ViewerState } from "../types";
import { clampOffset, getRotatedSize, scaleSize } from "../utils";

export const moveTo = (state: ViewerState, offset: Point): ViewerState => {
	if (
		!state.container.height ||
		!state.container.width ||
		!state.image.naturalHeight ||
		!state.image.naturalWidth
	) {
		return state;
	}

	const visualSize = scaleSize(
		getRotatedSize(
			{ height: state.image.naturalHeight, width: state.image.naturalWidth },
			state.image.rotation,
		),
		state.image.scale,
	);

	const { offsetX, offsetY } = clampOffset(offset, visualSize, {
		height: state.container.height,
		width: state.container.width,
	});

	if (state.image.offsetX === offsetX && state.image.offsetY === offsetY) {
		return state;
	}

	return {
		...state,
		image: {
			...state.image,
			offsetX,
			offsetY,
		},
	};
};
