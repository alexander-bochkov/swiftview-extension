import type { Size, ViewerState } from "../../types";
import { getFitScale } from "./utils";

export const load = (state: ViewerState, naturalSize: Size): ViewerState => {
	if (!state.container.height || !state.container.width) {
		return {
			...state,
			image: {
				...state.image,
				...naturalSize,
			},
		};
	}

	const fitScale = getFitScale(naturalSize, {
		height: state.container.height,
		width: state.container.width,
	});

	return {
		...state,
		image: {
			...state.image,
			...naturalSize,
			scale: fitScale,
		},
	};
};
