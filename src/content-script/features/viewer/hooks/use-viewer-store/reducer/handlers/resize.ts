import type { Size, ViewerState } from "../../types";
import { getFitScale } from "./utils";

export const resize = (
	state: ViewerState,
	containerSize: Size,
): ViewerState => {
	if (!state.image.height || !state.image.width) {
		return {
			...state,
			container: {
				...state.container,
				...containerSize,
			},
		};
	}

	const fitScale = getFitScale(
		{ height: state.image.height, width: state.image.width },
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
