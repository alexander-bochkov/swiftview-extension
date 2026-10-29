import { POINTER_BUTTON } from "@shared/constants";
import type { Nullable } from "@shared/types";
import type { ScrollbarHider } from "../scrollbar-hider";

type EventType = keyof WindowEventMap;

const BLOCKED_EVENTS = [
	// Keyboard
	"keydown",
	"keypress",
	"keyup",

	// Mouse
	"auxclick",
	"click",
	"contextmenu",
	"dblclick",
	"mousedown",
	"mousemove",
	"mouseout",
	"mouseover",
	"mouseup",
	"wheel",

	// Pointer
	"pointercancel",
	"pointerdown",
	"pointermove",
	"pointerout",
	"pointerover",
	"pointerup",

	// Touch
	"touchcancel",
	"touchend",
	"touchmove",
	"touchstart",
] as const satisfies readonly EventType[];

const isAuxiliaryPress = (e: Event): boolean =>
	e.type === "mousedown" &&
	e instanceof MouseEvent &&
	e.button === POINTER_BUTTON.AUXILIARY;

// Blocks the page while the viewer is open. Events of the page are hidden
// from it and their default action is prevented. Events of the viewer reach
// the viewer, but not the page listeners above it, and never scroll the page.
// The scrollbars of the page are hidden too.
//
// Listeners the page added to the window in the capture phase before the lock,
// and page listeners on the document in the capture phase, still see the
// events of the viewer: stopping those would stop them for the viewer too.
export class PageLock {
	private readonly scrollbarHider: ScrollbarHider;

	private controller: Nullable<AbortController> = null;
	private host: Nullable<Element> = null;

	constructor(scrollbarHider: ScrollbarHider) {
		this.scrollbarHider = scrollbarHider;
	}

	get isLocked(): boolean {
		return this.controller !== null;
	}

	// The host is the element that contains the viewer. It must not be reused
	// after unlock.
	lock(host: Element): void {
		if (this.controller) return;

		this.controller = new AbortController();
		this.host = host;

		const signal = this.controller.signal;

		for (const type of BLOCKED_EVENTS) {
			// Not passive, otherwise wheel and touch events can't be prevented.
			window.addEventListener(type, this.handleEvent, {
				capture: true,
				passive: false,
				signal,
			});

			// No signal: the viewer may close while one of its events is still
			// being dispatched (Escape, a click on the backdrop), and the event
			// must not reach the page after that. The listeners go away with the
			// host.
			host.addEventListener(type, this.handleViewerEvent);
		}

		this.scrollbarHider.hide();
	}

	unlock(): void {
		if (!this.controller) return;

		this.controller.abort();
		this.controller = null;
		this.host = null;

		this.scrollbarHider.restore();
	}

	private handleEvent = (e: Event): void => {
		if (this.host && e.composedPath().includes(this.host)) {
			// The page must not scroll: the viewer handles the wheel itself, and a
			// press of the wheel would start autoscrolling the page.
			if (e.type === "wheel" || isAuxiliaryPress(e)) e.preventDefault();

			return;
		}

		e.preventDefault();
		e.stopImmediatePropagation();
	};

	private handleViewerEvent = (e: Event): void => {
		e.stopPropagation();
	};
}
