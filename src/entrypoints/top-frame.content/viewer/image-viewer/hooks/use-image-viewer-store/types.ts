import type { ActionDispatch } from "react";
import type { Nullable, Point } from "@/shared/types";
import type { FlipDirection, RotateDirection } from "../../types";

export type Size = Readonly<{
	height: number;
	width: number;
}>;

export type ZoomPayload = Readonly<{
	factor: number;
	point: Point;
}>;

export type ImageViewerAction =
	| { type: "ADVANCE_BLOCKING_TRANSITION" }
	| { type: "FLIP"; payload: FlipDirection }
	| { type: "MOVE_BY"; payload: Point }
	| { type: "RESIZE"; payload: Size }
	| { type: "ROTATE"; payload: RotateDirection }
	| { type: "TOGGLE_ZOOM"; payload: Point }
	| { type: "ZOOM"; payload: ZoomPayload };

export type BlockingTransition =
	| Readonly<{ direction: RotateDirection; phase: "fitting" }>
	| Readonly<{ phase: "settling" }>;

export type ImageViewerState = Readonly<{
	blockingTransition: Nullable<BlockingTransition>;
	containerSize: Nullable<Size>;
	flip: Readonly<{ x: 1 | -1; y: 1 | -1 }>;
	naturalSize: Size;
	offset: Point;
	rotation: number;
	scale: number;
}>;

export type ImageViewerStore = {
	dispatch: ActionDispatch<[ImageViewerAction]>;
	state: ImageViewerState;
};
