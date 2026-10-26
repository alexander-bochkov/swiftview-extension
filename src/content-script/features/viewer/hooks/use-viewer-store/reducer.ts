import type { Reducer } from "react";
import {
	flip,
	load,
	moveBy,
	resize,
	rotate,
	toggleZoom,
	zoom,
} from "./handlers";
import type { ViewerAction, ViewerState } from "./types";

export const reducer: Reducer<ViewerState, ViewerAction> = (state, action) => {
	switch (action.type) {
		case "FLIP":
			return flip(state, action.payload);
		case "LOAD":
			return load(state, action.payload);
		case "MOVE_BY":
			return moveBy(state, action.payload);
		case "RESIZE":
			return resize(state, action.payload);
		case "ROTATE":
			return rotate(state, action.payload);
		case "TOGGLE_ZOOM":
			return toggleZoom(state, action.payload);
		case "ZOOM":
			return zoom(state, action.payload);
	}
};
