import type { ViewerState } from "../types";
import { rotate } from "./rotate";

export const applyPendingRotation = (state: ViewerState): ViewerState =>
	state.pendingRotation
		? rotate({ ...state, pendingRotation: null }, state.pendingRotation)
		: state;
