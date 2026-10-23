import { useMemo, useReducer } from "react";
import { reducer } from "./reducer";
import type { ViewerState, ViewerStore } from "./types";

const INITIAL_STATE: ViewerState = {
	container: {
		height: null,
		width: null,
	},
	image: {
		flipX: 1,
		flipY: 1,
		naturalHeight: null,
		naturalWidth: null,
		offsetX: 0,
		offsetY: 0,
		rotation: 0,
		scale: 1,
	},
};

export const useViewerStore = (): ViewerStore => {
	const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
	return useMemo(() => ({ dispatch, state }), [state]);
};
