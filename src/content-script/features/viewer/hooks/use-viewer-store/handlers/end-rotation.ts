import type { ViewerState } from "../types";

export const endRotation = (state: ViewerState): ViewerState =>
	state.isRotating ? { ...state, isRotating: false } : state;
