import {
	MOVE_THRESHOLD,
	POINTER_BUTTON,
	POINTER_TYPE,
} from "@shared/constants";
import type { Nullable, Point } from "@shared/types";
import { type ComponentProps, useRef } from "react";
import type { ViewerStore } from "../use-viewer-store";

type UseImageDragOptions = { store: ViewerStore };

type UseImageDragReturn = Pick<
	ComponentProps<"img">,
	| "onClickCapture"
	| "onLostPointerCapture"
	| "onPointerDown"
	| "onPointerMove"
	| "onPointerUp"
>;

type Press = {
	isDragging: boolean;
	readonly pointerId: number;
	readonly startOffset: Point;
	readonly startPoint: Point;
};

export const useImageDrag = ({
	store: {
		dispatch,
		state: {
			image: { offsetX, offsetY },
		},
	},
}: UseImageDragOptions): UseImageDragReturn => {
	const pressRef = useRef<Nullable<Press>>(null);
	const shouldStopClickRef = useRef(false);

	return {
		// A drag ends with a click, which must not reach the click handlers.
		onClickCapture: (e) => {
			if (!shouldStopClickRef.current) return;

			e.stopPropagation();
			shouldStopClickRef.current = false;
		},
		onLostPointerCapture: (e) => {
			if (pressRef.current?.pointerId !== e.pointerId) return;

			pressRef.current = null;
		},
		onPointerDown: (e) => {
			// Currently, only the mouse is supported.
			if (e.pointerType !== POINTER_TYPE.MOUSE) return;

			const hasModifierKey = e.altKey || e.ctrlKey || e.metaKey || e.shiftKey;

			if (
				e.button !== POINTER_BUTTON.MAIN ||
				!e.isPrimary ||
				!e.isTrusted ||
				hasModifierKey
			) {
				return;
			}

			// Keeps the moves coming when the pointer leaves the element, and
			// targets the click at it.
			e.currentTarget.setPointerCapture(e.pointerId);

			pressRef.current = {
				isDragging: false,
				pointerId: e.pointerId,
				startOffset: { x: offsetX, y: offsetY },
				startPoint: { x: e.clientX, y: e.clientY },
			};

			shouldStopClickRef.current = false;
		},
		onPointerMove: (e) => {
			if (pressRef.current?.pointerId !== e.pointerId) return;

			const delta = {
				x: e.clientX - pressRef.current.startPoint.x,
				y: e.clientY - pressRef.current.startPoint.y,
			};

			if (!pressRef.current.isDragging) {
				if (Math.max(Math.abs(delta.x), Math.abs(delta.y)) < MOVE_THRESHOLD) {
					return;
				}

				pressRef.current.isDragging = true;
			}

			dispatch({
				payload: {
					x: pressRef.current.startOffset.x + delta.x,
					y: pressRef.current.startOffset.y + delta.y,
				},
				type: "MOVE_TO",
			});
		},
		onPointerUp: (e) => {
			if (pressRef.current?.pointerId !== e.pointerId) return;
			// Only a drag that ended normally is followed by a click.
			shouldStopClickRef.current = pressRef.current.isDragging;
		},
	};
};
