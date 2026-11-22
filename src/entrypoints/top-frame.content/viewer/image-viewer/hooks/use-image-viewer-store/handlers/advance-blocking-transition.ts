import type { ImageViewerState } from "../types";
import { rotate } from "./rotate";

export const advanceBlockingTransition = (
	state: ImageViewerState,
): ImageViewerState => {
	const transition = state.blockingTransition;
	if (!transition) return state;

	const ended = { ...state, blockingTransition: null };

	return transition.phase === "fitting"
		? rotate(ended, transition.direction)
		: ended;
};
