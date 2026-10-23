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
	| { type: "FLIP"; payload: FlipDirection }
	| { type: "LOAD"; payload: Size }
	| { type: "MOVE_TO"; payload: Point }
	| { type: "RESIZE"; payload: Size }
	| { type: "ROTATE"; payload: RotateDirection }
	| { type: "TOGGLE_ZOOM"; payload: Point }
	| { type: "ZOOM"; payload: ZoomPayload };

export type ViewerState = Readonly<{
	container: Readonly<{
		height: Nullable<number>;
		width: Nullable<number>;
	}>;
	image: Readonly<{
		flipX: 1 | -1;
		flipY: 1 | -1;
		height: Nullable<number>;
		offsetX: number;
		offsetY: number;
		rotation: number;
		scale: number;
		width: Nullable<number>;
	}>;
}>;

export type ViewerStore = {
	dispatch: ActionDispatch<[ViewerAction]>;
	state: ViewerState;
};
