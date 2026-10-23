import type { Point } from "@shared/types";
import type { ViewerState } from "../../types";
import { clampOffset, scaleSize } from "./utils";

export const moveTo = (state: ViewerState, offset: Point): ViewerState => {
	if (
		!state.container.height ||
		!state.container.width ||
		!state.image.height ||
		!state.image.width
	) {
		return state;
	}

	const visualSize = scaleSize(
		{ height: state.image.height, width: state.image.width },
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
