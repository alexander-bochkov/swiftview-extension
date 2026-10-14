import { type ActionDispatch, type Reducer, useMemo, useReducer } from "react";
import type { FlipDirection, RotateDirection } from "../../types";

type FlipScale = 1 | -1;

type ViewerAction =
	| { type: "FLIP"; payload: FlipDirection }
	| { type: "ROTATE"; payload: RotateDirection };

type ViewerState = {
	readonly rotation: number;
	readonly scaleX: FlipScale;
	readonly scaleY: FlipScale;
};

export type Viewer = {
	dispatch: ActionDispatch<[ViewerAction]>;
	state: ViewerState;
};

const INITIAL_STATE: ViewerState = {
	rotation: 0,
	scaleX: 1,
	scaleY: 1,
};

const QUARTER_TURN = 90;

const toggle = (scale: FlipScale): FlipScale => (scale === 1 ? -1 : 1);

const reducer: Reducer<ViewerState, ViewerAction> = (
	state,
	{ payload, type },
) => {
	switch (type) {
		case "FLIP":
			return payload === "horizontal"
				? { ...state, scaleX: toggle(state.scaleX) }
				: { ...state, scaleY: toggle(state.scaleY) };
		case "ROTATE": {
			const step = payload === "right" ? QUARTER_TURN : -QUARTER_TURN;
			// A mirrored image turns the other way on screen, so the step is
			// inverted to keep the visual direction.
			const isMirrored = state.scaleX !== state.scaleY;

			return {
				...state,
				rotation: state.rotation + (isMirrored ? -step : step),
			};
		}
	}
};

export const useViewer = (): Viewer => {
	const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
	return useMemo(() => ({ dispatch, state }), [state]);
};
