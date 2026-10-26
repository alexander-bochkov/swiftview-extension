import { useMemo, useReducer } from "react";
import { NATURAL_SIZE_SCALE, ZERO_POINT } from "./constants";
import { reducer } from "./reducer";
import type { ViewerState, ViewerStore } from "./types";

const INITIAL_STATE: ViewerState = {
	containerSize: null,
	flip: { x: 1, y: 1 },
	naturalSize: null,
	offset: ZERO_POINT,
	rotation: 0,
	scale: NATURAL_SIZE_SCALE,
};

export const useViewerStore = (): ViewerStore => {
	const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
	return useMemo(() => ({ dispatch, state }), [state]);
};
