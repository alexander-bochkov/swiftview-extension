import type { Point } from "@shared/types";
import type { ViewerState } from "../types";
import {
	clampOffset,
	getRotatedSize,
	getToggledScale,
	scaleSize,
	zoomOffset,
} from "../utils";

export const toggleZoom = (state: ViewerState, point: Point): ViewerState => {
	if (
		!state.container.height ||
		!state.container.width ||
		!state.image.naturalHeight ||
		!state.image.naturalWidth
	) {
		return state;
	}

	const imageSize = getRotatedSize(
		{ height: state.image.naturalHeight, width: state.image.naturalWidth },
		state.image.rotation,
	);
	const containerSize = {
		height: state.container.height,
		width: state.container.width,
	};

	const scale = getToggledScale(state.image.scale, imageSize, containerSize);
	const visualSize = scaleSize(imageSize, scale);

	const offset = zoomOffset(
		{ x: state.image.offsetX, y: state.image.offsetY },
		point,
		scale / state.image.scale,
	);

	const { offsetX, offsetY } = clampOffset(offset, visualSize, containerSize);

	return {
		...state,
		image: {
			...state.image,
			offsetX,
			offsetY,
			scale,
		},
	};
};
