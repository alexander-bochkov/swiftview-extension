import type { Nullable, Point } from "@shared/types";
import type { ActionDispatch } from "react";
import type { FlipDirection, RotateDirection } from "../../types";

export type Size = Readonly<{
	height: number;
	width: number;
}>;

export type ZoomPayload = Readonly<{
	factor: number;
	point: Point;
}>;

export type ViewerAction =
	| { type: "APPLY_PENDING_ROTATION" }
	| { type: "END_ROTATION" }
	| { type: "FAIL" }
	| { type: "FLIP"; payload: FlipDirection }
	| { type: "LOAD"; payload: Size }
	| { type: "MOVE_BY"; payload: Point }
	| { type: "RESIZE"; payload: Size }
	| { type: "ROTATE"; payload: RotateDirection }
	| { type: "TOGGLE_ZOOM"; payload: Point }
	| { type: "ZOOM"; payload: ZoomPayload };

// A rotation first returns a zoomed or moved image to the fitted size, then
// turns it.
export type RotationStep =
	| Readonly<{ direction: RotateDirection; phase: "fitting" }>
	| Readonly<{ phase: "turning" }>;

export type ViewerState = Readonly<{
	containerSize: Nullable<Size>;
	flip: Readonly<{ x: 1 | -1; y: 1 | -1 }>;
	hasImageError: boolean;
	naturalSize: Nullable<Size>;
	offset: Point;
	rotation: number;
	rotationStep: Nullable<RotationStep>;
	scale: number;
}>;

export type ViewerStore = {
	dispatch: ActionDispatch<[ViewerAction]>;
	state: ViewerState;
};
