import type { Reducer } from "react";
import {
	advanceBlockingTransition,
	fail,
	flip,
	load,
	moveBy,
	resize,
	rotate,
	toggleZoom,
	zoom,
} from "./handlers";
import type { ViewerAction, ViewerState } from "./types";

const BLOCKED_ACTIONS: readonly ViewerAction["type"][] = [
	"FLIP",
	"MOVE_BY",
	"ROTATE",
	"TOGGLE_ZOOM",
	"ZOOM",
];

export const reducer: Reducer<ViewerState, ViewerAction> = (state, action) => {
	if (state.blockingTransition && BLOCKED_ACTIONS.includes(action.type)) {
		return state;
	}

	switch (action.type) {
		case "ADVANCE_BLOCKING_TRANSITION":
			return advanceBlockingTransition(state);
		case "FAIL":
			return fail(state);
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
