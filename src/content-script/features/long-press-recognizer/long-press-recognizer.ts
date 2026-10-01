import { MOUSE_BUTTON } from "@shared/constants";
import type { Optional } from "@shared/types";

type LongPressRecognizerOptions = Readonly<{
	delay: number;
	onLongPress: (x: number, y: number) => void;
	shouldIgnore: (event: MouseEvent) => boolean;
}>;

const BLOCKED_EVENTS = [
	"click",
	"dragstart",
	"mousemove",
	"mouseup",
	"pointermove",
	"pointerup",
] as const;

export class LongPressRecognizer {
	private readonly options: LongPressRecognizerOptions;

	private blockController: Optional<AbortController>;
	private listenerController: Optional<AbortController>;
	private timer: Optional<ReturnType<typeof setTimeout>>;

	constructor(options: LongPressRecognizerOptions) {
		this.options = options;
	}

	enable() {
		if (this.listenerController) return;

		this.listenerController = new AbortController();

		const options: AddEventListenerOptions = {
			capture: true,
			signal: this.listenerController.signal,
		};

		window.addEventListener("mousedown", this.handleMouseDown, options);
		window.addEventListener("mouseup", this.handleCancel, options);
		window.addEventListener("dragstart", this.handleCancel, options);
	}

	disable() {
		this.listenerController?.abort();
		this.listenerController = undefined;

		this.clearTimer();
		this.stopBlocking();
	}

	private handleMouseDown = (event: MouseEvent) => {
		if (event.button !== MOUSE_BUTTON.MAIN || !event.isTrusted) return;

		this.clearTimer();
		this.stopBlocking();

		if (this.options.shouldIgnore(event)) return;

		this.startTimer(() => {
			this.clearTimer();
			this.startBlocking();
			this.options.onLongPress(event.clientX, event.clientY);
		});
	};

	private handleCancel = () => this.clearTimer();

	private startTimer(handler: () => void) {
		this.timer = setTimeout(handler, this.options.delay);
	}

	private clearTimer() {
		clearTimeout(this.timer);
		this.timer = undefined;
	}

	private startBlocking() {
		this.blockController = new AbortController();

		const options: AddEventListenerOptions = {
			capture: true,
			signal: this.blockController.signal,
		};

		BLOCKED_EVENTS.forEach((type) => {
			window.addEventListener(type, this.blockEvent, options);
		});
	}

	private stopBlocking() {
		this.blockController?.abort();
		this.blockController = undefined;
	}

	private blockEvent = (event: Event) => {
		event.preventDefault();
		event.stopImmediatePropagation();

		if (event.type === "mouseup") setTimeout(() => this.stopBlocking(), 0);
	};
}
