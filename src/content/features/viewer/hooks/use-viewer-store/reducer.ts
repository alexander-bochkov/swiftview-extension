import type { Reducer } from "react";
import {
	applyPendingRotation,
	endRotation,
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

// During a rotation, these would undo the return to the fitted size or mix
// with the turn, so they're ignored until it ends.
const BLOCKED_BY_ROTATION: readonly ViewerAction["type"][] = [
	"FLIP",
	"MOVE_BY",
	"ROTATE",
	"TOGGLE_ZOOM",
	"ZOOM",
];

export const reducer: Reducer<ViewerState, ViewerAction> = (state, action) => {
	if (state.rotationStep && BLOCKED_BY_ROTATION.includes(action.type)) {
		return state;
	}

	switch (action.type) {
		case "APPLY_PENDING_ROTATION":
			return applyPendingRotation(state);
		case "END_ROTATION":
			return endRotation(state);
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
