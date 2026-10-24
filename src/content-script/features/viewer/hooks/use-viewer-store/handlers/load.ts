import type { Size, ViewerState } from "../types";
import { getFitScale, getRotatedSize } from "../utils";

export const load = (state: ViewerState, naturalSize: Size): ViewerState => {
	const image = {
		...state.image,
		naturalHeight: naturalSize.height,
		naturalWidth: naturalSize.width,
	};

	if (!state.container.height || !state.container.width) {
		return { ...state, image };
	}

	const fitScale = getFitScale(
		getRotatedSize(naturalSize, state.image.rotation),
		{
			height: state.container.height,
			width: state.container.width,
		},
	);

	return {
		...state,
		image: {
			...image,
			scale: fitScale,
		},
	};
};
