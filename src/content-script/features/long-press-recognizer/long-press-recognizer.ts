import { POINTER_BUTTON, POINTER_TYPE } from "@shared/constants";
import type { Nullable, Point } from "@shared/types";
import type { EventBlocker } from "../event-blocker";

const BLOCKED_EVENTS = [
	"click",
	"mousemove",
	"mouseup",
	"pointermove",
	"pointerup",
] as const;

// In px, per axis. Matches the smallest drag threshold of Chromium.
const MOVE_THRESHOLD = 3;

type LongPressRecognizerOptions = {
	readonly delay: number;
	readonly onLongPress: (point: Point) => void;
	readonly shouldIgnore: () => boolean;
};

export class LongPressRecognizer {
	private readonly blocker: EventBlocker;
	private readonly options: LongPressRecognizerOptions;

	private controller: Nullable<AbortController> = null;

	private pressPoint: Nullable<Point> = null;
	private timer: Nullable<ReturnType<typeof setTimeout>> = null;

	constructor(blocker: EventBlocker, options: LongPressRecognizerOptions) {
		this.blocker = blocker;
		this.options = options;
	}

	enable(): void {
		if (this.controller) return;

		this.controller = new AbortController();
		const signal = this.controller.signal;

		window.addEventListener("pointerdown", this.handlePressStart, {
			capture: true,
			signal,
		});

		window.addEventListener("pointermove", this.handlePressMove, {
			capture: true,
			signal,
		});

		window.addEventListener("pointerup", this.handlePressEnd, {
			capture: true,
			signal,
		});

		window.addEventListener("pointercancel", this.handlePressCancel, {
			capture: true,
			signal,
		});

		// Not captured: otherwise blur events of focused elements would cancel
		// the press too.
		window.addEventListener("blur", this.handlePressCancel, { signal });
	}

	disable(): void {
		this.controller?.abort();
		this.controller = null;

		this.stopPress();
		this.blocker.stop();
	}

	private handlePressStart = (e: PointerEvent): void => {
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

		this.stopPress();
		this.blocker.stop();

		if (this.options.shouldIgnore()) return;

		this.startPress({ x: e.clientX, y: e.clientY });
	};

	private handlePressMove = (e: PointerEvent): void => {
		if (!this.pressPoint) return;

		const dx = Math.abs(e.clientX - this.pressPoint.x);
		const dy = Math.abs(e.clientY - this.pressPoint.y);

		if (Math.max(dx, dy) >= MOVE_THRESHOLD) this.stopPress();
	};

	private handlePressEnd = (): void => {
		this.stopPress();

		// Click fires right after pointerup, so stop blocking on the next task.
		if (this.blocker.isActive) setTimeout(() => this.blocker.stop(), 0);
	};

	private handlePressCancel = (): void => {
		this.stopPress();
		this.blocker.stop();
	};

	private startPress(point: Point): void {
		this.pressPoint = point;
		this.timer = setTimeout(
			() => this.fireLongPress(point),
			this.options.delay,
		);
	}

	private stopPress(): void {
		this.pressPoint = null;

		if (this.timer === null) return;

		clearTimeout(this.timer);
		this.timer = null;
	}

	private fireLongPress(point: Point): void {
		this.stopPress();
		this.blocker.start(BLOCKED_EVENTS);
		this.options.onLongPress(point);
	}
}
