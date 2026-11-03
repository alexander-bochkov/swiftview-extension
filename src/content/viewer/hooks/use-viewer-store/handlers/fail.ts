import type { ViewerState } from "../types";

export const fail = (state: ViewerState): ViewerState => ({
	...state,
	hasImageError: true,
});
