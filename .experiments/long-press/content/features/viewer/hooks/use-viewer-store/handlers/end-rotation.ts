import type { ViewerState } from "../types";

export const endRotation = (state: ViewerState): ViewerState =>
	state.rotationStep?.phase === "turning"
		? { ...state, rotationStep: null }
		: state;
