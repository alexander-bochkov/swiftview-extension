import {
	MOVE_THRESHOLD,
	POINTER_BUTTON,
	POINTER_TYPE,
} from "@shared/constants";
import type { Nullable, Point } from "@shared/types";
import { hasModifierKey } from "@shared/utils";
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
	lastPoint: Point;
	readonly pointerId: number;
	readonly startPoint: Point;
};

export const useImageDrag = ({
	store: { dispatch },
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

			if (
				e.button !== POINTER_BUTTON.MAIN ||
				!e.isPrimary ||
				!e.isTrusted ||
				hasModifierKey(e)
			) {
				return;
			}

			// Keeps the moves coming when the pointer leaves the element, and
			// targets the click at it.
			e.currentTarget.setPointerCapture(e.pointerId);

			const point = { x: e.clientX, y: e.clientY };

			pressRef.current = {
				isDragging: false,
				lastPoint: point,
				pointerId: e.pointerId,
				startPoint: point,
			};

			shouldStopClickRef.current = false;
		},
		onPointerMove: (e) => {
			const press = pressRef.current;
			if (press?.pointerId !== e.pointerId) return;

			if (!press.isDragging) {
				const distance = Math.max(
					Math.abs(e.clientX - press.startPoint.x),
					Math.abs(e.clientY - press.startPoint.y),
				);

				if (distance < MOVE_THRESHOLD) return;

				press.isDragging = true;
			}

			dispatch({
				payload: {
					x: e.clientX - press.lastPoint.x,
					y: e.clientY - press.lastPoint.y,
				},
				type: "MOVE_BY",
			});

			press.lastPoint = { x: e.clientX, y: e.clientY };
		},
		onPointerUp: (e) => {
			if (pressRef.current?.pointerId !== e.pointerId) return;
			// Only a drag that ended normally is followed by a click.
			shouldStopClickRef.current = pressRef.current.isDragging;
		},
	};
};
