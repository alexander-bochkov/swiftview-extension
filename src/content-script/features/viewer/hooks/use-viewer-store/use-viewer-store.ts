import type { Nullable, Point } from "@shared/types";
import { type ActionDispatch, type Reducer, useMemo, useReducer } from "react";
import type { FlipDirection, RotateDirection } from "../../types";

type FlipScale = 1 | -1;

export type Zoom = {
	// From the center of the container to the center of the image, in px.
	readonly offset: Point;
	readonly scale: number;
};

type Action =
	| { type: "FLIP"; payload: FlipDirection }
	| { type: "RESET_ZOOM" }
	| { type: "ROTATE"; payload: RotateDirection }
	| { type: "ZOOM"; payload: Zoom };

type State = {
	readonly rotation: number;
	readonly scaleX: FlipScale;
	readonly scaleY: FlipScale;
	// Null while the image is fitted to the container.
	readonly zoom: Nullable<Zoom>;
};

export type ViewerStore = {
	dispatch: ActionDispatch<[Action]>;
	state: State;
};

const INITIAL_STATE: State = {
	rotation: 0,
	scaleX: 1,
	scaleY: 1,
	zoom: null,
};

const QUARTER_TURN = 90;

const toggle = (scale: FlipScale): FlipScale => (scale === 1 ? -1 : 1);

const reducer: Reducer<State, Action> = (state, action) => {
	switch (action.type) {
		// Flips and rotations change the visual size, so they reset the zoom.
		case "FLIP":
			return action.payload === "horizontal"
				? { ...state, scaleX: toggle(state.scaleX), zoom: null }
				: { ...state, scaleY: toggle(state.scaleY), zoom: null };
		case "RESET_ZOOM":
			return state.zoom ? { ...state, zoom: null } : state;
		case "ROTATE": {
			const step = action.payload === "right" ? QUARTER_TURN : -QUARTER_TURN;
			// A mirrored image turns the other way on screen, so the step is
			// inverted to keep the visual direction.
			const isMirrored = state.scaleX !== state.scaleY;

			return {
				...state,
				rotation: state.rotation + (isMirrored ? -step : step),
				zoom: null,
			};
		}
		case "ZOOM":
			return { ...state, zoom: action.payload };
	}
};

export const useViewerStore = (): ViewerStore => {
	const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
	return useMemo(() => ({ dispatch, state }), [state]);
};
