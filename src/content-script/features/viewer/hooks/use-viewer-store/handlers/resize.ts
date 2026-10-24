import type { Size, ViewerState } from "../types";
import { getFitScale, getRotatedSize } from "../utils";

export const resize = (
	state: ViewerState,
	containerSize: Size,
): ViewerState => {
	if (!state.image.naturalHeight || !state.image.naturalWidth) {
		return {
			...state,
			container: {
				...state.container,
				...containerSize,
			},
		};
	}

	const fitScale = getFitScale(
		getRotatedSize(
			{ height: state.image.naturalHeight, width: state.image.naturalWidth },
			state.image.rotation,
		),
		containerSize,
	);

	return {
		...state,
		container: {
			...state.container,
			...containerSize,
		},
		image: {
			...state.image,
			offsetX: 0,
			offsetY: 0,
			scale: fitScale,
		},
	};
};
