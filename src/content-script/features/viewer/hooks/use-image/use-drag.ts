import { POINTER_BUTTON, POINTER_TYPE } from "@shared/constants";
import type { Nullable, Point } from "@shared/types";
import {
	type ComponentProps,
	type PointerEvent,
	useRef,
	useState,
} from "react";

// In px, per axis. Matches the smallest drag threshold of Chromium.
const MOVE_THRESHOLD = 3;

type UseDragOptions = {
	// Receives the distance from the point where the drag started.
	onDrag: (delta: Point) => void;
	onDragStart: () => void;
};

type UseDragReturn = Pick<
	ComponentProps<"img">,
	| "onClickCapture"
	| "onPointerCancel"
	| "onPointerDown"
	| "onPointerMove"
	| "onPointerUp"
> & {
	isDragging: boolean;
};

type Press = {
	isMoving: boolean;
	readonly pointerId: number;
	readonly start: Point;
};

export const useDrag = ({
	onDrag,
	onDragStart,
}: UseDragOptions): UseDragReturn => {
	// Refs, so the events that arrive before the next render see the press.
	const pressRef = useRef<Nullable<Press>>(null);
	const wasDraggedRef = useRef(false);
	const [isDragging, setIsDragging] = useState(false);

	const handlePressEnd = ({ pointerId }: PointerEvent): void => {
		const press = pressRef.current;
		if (press?.pointerId !== pointerId) return;

		wasDraggedRef.current = press.isMoving;
		pressRef.current = null;
		setIsDragging(false);
	};

	return {
		isDragging,
		// A drag ends with a click, which must not reach the click handlers.
		onClickCapture: (e) => {
			if (!wasDraggedRef.current) return;

			wasDraggedRef.current = false;
			e.stopPropagation();
		},
		onPointerCancel: handlePressEnd,
		onPointerDown: (e) => {
			// Currently, only the mouse is supported.
			if (
				e.pointerType !== POINTER_TYPE.MOUSE ||
				e.button !== POINTER_BUTTON.MAIN ||
				!e.isPrimary
			) {
				return;
			}

			// Keeps the moves coming when the pointer leaves the element, and
			// targets the click at it.
			e.currentTarget.setPointerCapture(e.pointerId);

			pressRef.current = {
				isMoving: false,
				pointerId: e.pointerId,
				start: { x: e.clientX, y: e.clientY },
			};
			wasDraggedRef.current = false;

			onDragStart();
		},
		onPointerMove: ({ clientX, clientY, pointerId }) => {
			const press = pressRef.current;
			if (press?.pointerId !== pointerId) return;

			const delta = { x: clientX - press.start.x, y: clientY - press.start.y };

			if (!press.isMoving) {
				if (Math.max(Math.abs(delta.x), Math.abs(delta.y)) < MOVE_THRESHOLD) {
					return;
				}

				press.isMoving = true;
				setIsDragging(true);
			}

			onDrag(delta);
		},
		onPointerUp: handlePressEnd,
	};
};
