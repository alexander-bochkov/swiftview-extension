import type { Nullable, Point } from "@shared/types";

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

const getScrollPosition = (): Point => ({
	x: window.scrollX,
	y: window.scrollY,
});

// Blocks the page while the viewer is open. Events of the page are hidden
// from it and their default action is prevented. Events of the viewer reach
// the viewer, but not the page listeners above it, and never scroll the page.
//
// Listeners the page added to the window in the capture phase before the lock,
// and page listeners on the document in the capture phase, still see the
// events of the viewer: stopping those would stop them for the viewer too.
export class PageLock {
	private controller: Nullable<AbortController> = null;
	private host: Nullable<Element> = null;
	private scrollPosition: Point = { x: 0, y: 0 };

	get isLocked(): boolean {
		return this.controller !== null;
	}

	// The host is the element that contains the viewer. It must not be reused
	// after unlock.
	lock(host: Element): void {
		if (this.controller) return;

		this.controller = new AbortController();
		this.host = host;
		this.scrollPosition = getScrollPosition();

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

		// Scrolling with the scrollbar can't be prevented, so it is undone.
		window.addEventListener("scroll", this.handleScroll, {
			capture: true,
			signal,
		});
	}

	unlock(): void {
		this.controller?.abort();
		this.controller = null;
		this.host = null;
	}

	private handleEvent = (e: Event): void => {
		if (this.host && e.composedPath().includes(this.host)) {
			// The viewer handles the wheel itself, the page must not scroll.
			if (e.type === "wheel") e.preventDefault();

			return;
		}

		e.preventDefault();
		e.stopImmediatePropagation();
	};

	private handleViewerEvent = (e: Event): void => {
		e.stopPropagation();
	};

	private handleScroll = (e: Event): void => {
		e.stopImmediatePropagation();

		const { x, y } = this.scrollPosition;

		if (window.scrollX === x && window.scrollY === y) return;

		// Instant, so `scroll-behavior: smooth` of the page doesn't animate it.
		window.scrollTo({ behavior: "instant", left: x, top: y });
	};
}
