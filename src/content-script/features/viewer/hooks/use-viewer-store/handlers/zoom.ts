import { MAX_SCALE } from "../constants";
import type { ViewerState, ZoomPayload } from "../types";
import {
	clampOffset,
	getFitScale,
	getRotatedSize,
	scaleSize,
	zoomOffset,
} from "../utils";

export const zoom = (
	state: ViewerState,
	{ factor, point }: ZoomPayload,
): ViewerState => {
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

	const fitScale = getFitScale(imageSize, containerSize);
	const scale = Math.min(
		Math.max(fitScale, state.image.scale * factor),
		MAX_SCALE,
	);

	if (scale === state.image.scale) return state;

	const offset = zoomOffset(
		{ x: state.image.offsetX, y: state.image.offsetY },
		point,
		scale / state.image.scale,
	);

	const { offsetX, offsetY } = clampOffset(
		offset,
		scaleSize(imageSize, scale),
		containerSize,
	);

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
