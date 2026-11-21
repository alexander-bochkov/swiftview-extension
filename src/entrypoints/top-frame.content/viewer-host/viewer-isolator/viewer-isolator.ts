import { POINTER_BUTTON } from "@/shared/constants";
import type { Nullable } from "@/shared/types";

const KEY_EVENT_TYPES = ["keydown", "keypress", "keyup"] as const;

// Keys whose default action scrolls the page. By `key`, not `code`, so the
// numpad arrows with Num Lock off are covered too.
const SCROLL_KEYS: readonly string[] = [
	" ",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
	"ArrowUp",
	"End",
	"Home",
	"PageDown",
	"PageUp",
];

// The events of the viewer hidden from the page, e.g. from its shortcuts and
// "click outside" handlers. Stopped, not prevented, so the context menu of the
// browser still opens. Not the moves: they are many, and the page reacts to
// them only after a press.
const STOPPED_EVENT_TYPES = [
	"auxclick",
	"click",
	"contextmenu",
	"dblclick",
	"keydown",
	"keypress",
	"keyup",
	"mousedown",
	"mouseup",
	"pointerdown",
	"pointerup",
	"touchend",
	"touchstart",
	"wheel",
] as const;

const VIDEO_CONTROL_KEYS: readonly string[] = [
	" ",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
	"ArrowUp",
	"End",
	"Home",
];

const isScrollKey = (e: KeyboardEvent): boolean =>
	e.type === "keydown" &&
	SCROLL_KEYS.includes(e.key) &&
	// Browser shortcuts, like Alt+Left to go back.
	!e.altKey &&
	!e.metaKey;

// Whether the focused element of the viewer has a use for the key.
const isForFocusedElement = (e: KeyboardEvent, root: ShadowRoot): boolean => {
	const { activeElement } = root;

	if (activeElement instanceof HTMLMediaElement) {
		return VIDEO_CONTROL_KEYS.includes(e.key);
	}

	return activeElement instanceof HTMLButtonElement && e.key === " ";
};

// Captured at the window, ahead of the viewer and most of the page. Scroll
// keys don't scroll the page, unless the focused element of the viewer uses
// them. Keys that don't reach the viewer are hidden from the page: they go to
// the document when a Tab leaves the viewer's last control, or when its
// focused element is removed.
const isolateKeys = (
	host: HTMLElement,
	root: ShadowRoot,
	signal: AbortSignal,
): void => {
	for (const type of KEY_EVENT_TYPES) {
		window.addEventListener(
			type,
			(e) => {
				if (isScrollKey(e) && !isForFocusedElement(e, root)) e.preventDefault();
				if (!e.composedPath().includes(host)) e.stopImmediatePropagation();
			},
			{ capture: true, signal },
		);
	}
};

// A press of the wheel would start autoscrolling the page. Captured at the
// host, so the viewer's own listeners can't stop the press before.
const preventAutoscroll = (host: HTMLElement, signal: AbortSignal): void => {
	host.addEventListener(
		"mousedown",
		(e) => {
			if (e.button === POINTER_BUTTON.AUXILIARY) e.preventDefault();
		},
		{ capture: true, signal },
	);
};

// At the window, not the host: before sending a wheel, Chrome decides whether
// it can be prevented by where the listening elements are on screen. The host
// takes no space, as the viewer is in the top layer, so a listener there
// couldn't stop the page from scrolling. Not passive, which slows scrolling
// down, so only while the viewer is open. The viewer still gets the wheel for
// its own use.
const preventWheelScroll = (signal: AbortSignal): void => {
	window.addEventListener("wheel", (e) => e.preventDefault(), {
		capture: true,
		passive: false,
		signal,
	});
};

// On their way back up, before the listeners of the page above the host.
// Passive, as they don't prevent anything.
const stopViewerEvents = (host: HTMLElement, signal: AbortSignal): void => {
	for (const type of STOPPED_EVENT_TYPES) {
		host.addEventListener(type, (e) => e.stopPropagation(), {
			passive: true,
			signal,
		});
	}
};

export class ViewerIsolator {
	// Set while isolated: each isolation has its own, see release().
	private controller: Nullable<AbortController> = null;

	isolate(root: ShadowRoot): void {
		if (this.controller) return;

		this.controller = new AbortController();
		const { signal } = this.controller;

		// An Element has no key or mouse events, but a host is always an HTML one.
		const host = root.host as HTMLElement;

		isolateKeys(host, root, signal);
		preventAutoscroll(host, signal);
		preventWheelScroll(signal);
		stopViewerEvents(host, signal);
	}

	release(): void {
		// Kept for the timer, which then ends only this isolation: one started
		// in the meantime stays.
		const { controller } = this;
		if (!controller) return;

		this.controller = null;
		// After the current event: the one that closes the viewer, e.g. Escape,
		// is still on its way up, and without the listeners the page would see
		// it past the host.
		setTimeout(() => controller.abort());
	}
}
