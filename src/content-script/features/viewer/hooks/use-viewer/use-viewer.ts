import { type Reducer, useMemo, useReducer } from "react";
import type { Flip, Viewer, ViewerAction, ViewerState } from "../../types";

const INITIAL_STATE: ViewerState = {
	flipX: 1,
	flipY: 1,
	rotation: 0,
};

const QUARTER_TURN = 90;

const toggle = (flip: Flip): Flip => (flip === 1 ? -1 : 1);

const reducer: Reducer<ViewerState, ViewerAction> = (
	state,
	{ payload, type },
) => {
	switch (type) {
		case "FLIP": {
			return payload === "horizontal"
				? { ...state, flipX: toggle(state.flipX) }
				: { ...state, flipY: toggle(state.flipY) };
		}
		case "ROTATE": {
			const step = payload === "right" ? QUARTER_TURN : -QUARTER_TURN;
			const mirrored = state.flipX * state.flipY === -1;
			return { ...state, rotation: state.rotation + (mirrored ? -step : step) };
		}
	}
};

export const useViewer = (): Viewer => {
	const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
	return useMemo(() => ({ dispatch, state }), [state]);
};
