import type { ViewerState } from "../types";
import { rotate } from "./rotate";

export const applyPendingRotation = (state: ViewerState): ViewerState =>
	state.rotationStep?.phase === "fitting"
		? rotate({ ...state, rotationStep: null }, state.rotationStep.direction)
		: state;
