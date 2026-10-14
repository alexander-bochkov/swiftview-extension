import type { ActionDispatch } from "react";

export type FlipDirection = "horizontal" | "vertical";
export type RotateDirection = "left" | "right";

export type Flip = 1 | -1;

type Action<T extends Uppercase<string>, P = never> = [P] extends [never]
	? { type: T }
	: { type: T; payload: P };

export type ViewerAction =
	| Action<"FLIP", FlipDirection>
	| Action<"ROTATE", RotateDirection>;

export type ViewerState = {
	readonly flipX: Flip;
	readonly flipY: Flip;
	readonly rotation: number;
};

export type Viewer = {
	dispatch: ActionDispatch<[ViewerAction]>;
	state: ViewerState;
};
