import type { Point } from "@shared/types";
import type { ViewerState } from "../../types";
import { clampOffset, getToggledScale, scaleSize, zoomOffset } from "./utils";

export const toggleZoom = (state: ViewerState, point: Point): ViewerState => {
	if (
		!state.container.height ||
		!state.container.width ||
		!state.image.height ||
		!state.image.width
	) {
		return state;
	}

	const imageSize = { height: state.image.height, width: state.image.width };
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
