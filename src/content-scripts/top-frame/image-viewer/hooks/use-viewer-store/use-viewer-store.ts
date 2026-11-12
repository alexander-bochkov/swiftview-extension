import { useMemo, useReducer } from "react";
import { NATURAL_SIZE_SCALE, ZERO_POINT } from "./constants";
import { reducer } from "./reducer";
import type { Size, ViewerState, ViewerStore } from "./types";

const createInitialState = (naturalSize: Size): ViewerState => ({
	blockingTransition: null,
	containerSize: null,
	flip: { x: 1, y: 1 },
	naturalSize,
	offset: ZERO_POINT,
	rotation: 0,
	scale: NATURAL_SIZE_SCALE,
});

// The image is loaded before the viewer shows it, so its size is known from
// the start. The container size comes once the viewer is laid out.
export const useViewerStore = (naturalSize: Size): ViewerStore => {
	const [state, dispatch] = useReducer(
		reducer,
		naturalSize,
		createInitialState,
	);
	return useMemo(() => ({ dispatch, state }), [state]);
};
