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

export type ViewerState = Readonly<{
	containerSize: Nullable<Size>;
	flip: Readonly<{ x: 1 | -1; y: 1 | -1 }>;
	hasImageError: boolean;
	isRotating: boolean;
	naturalSize: Nullable<Size>;
	offset: Point;
	pendingRotation: Nullable<RotateDirection>;
	rotation: number;
	scale: number;
}>;

export type ViewerStore = {
	dispatch: ActionDispatch<[ViewerAction]>;
	state: ViewerState;
};
