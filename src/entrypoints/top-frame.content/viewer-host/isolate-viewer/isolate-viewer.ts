import { POINTER_BUTTON } from "@/shared/constants";

// The events of the viewer stopped at its host:
// - the keys, e.g. for the shortcuts of the page;
// - the mouse buttons, e.g. for the "click outside" handlers of the page or
//   its own context menu. The context menu of the browser is left to it;
// - the pointer and touch presses, for the same handlers. Not the moves:
//   they are many, and the page reacts to them after a press;
// - the wheel.
const STOPPED_TYPES = [
	"keydown",
	"keypress",
	"keyup",
	"auxclick",
	"click",
	"contextmenu",
	"dblclick",
	"mousedown",
	"mouseup",
	"pointerdown",
	"pointerup",
	"touchend",
	"touchstart",
	"wheel",
] as const;

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

// The scroll keys a focused video handles itself: Space plays, the arrows
// seek and change the volume, Home and End jump. The Page keys only scroll.
const VIDEO_KEYS: readonly string[] = [
	" ",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
	"ArrowUp",
	"End",
	"Home",
];

const KEY_TYPES = ["keydown", "keypress", "keyup"] as const;

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
		return VIDEO_KEYS.includes(e.key);
	}

	// Space on a focused button presses it.
	return e.key === " " && activeElement instanceof HTMLButtonElement;
};

// Keeps the page out of the viewer while it's open, so the page neither reacts
// to it nor scrolls behind it. Returns the function that stops it.
//
// The modal viewer makes the page inert, so the pointer can't reach the page.
// The keys can, once Tab moves the focus out of the viewer to the document.
// The capture listeners the page added to the window before the viewer opened,
// and those of the viewer's events on the document, still see the events, as
// they come first.
export const isolateViewer = (root: ShadowRoot): (() => void) => {
	const controller = new AbortController();
	const { signal } = controller;

	// Typed as an Element, which has no key or mouse events. A shadow root can
	// only be attached to an HTML element or a custom one.
	const host = root.host as HTMLElement;

	// On their way back up, before the listeners of the page above the host.
	// Passive, as they don't prevent anything.
	for (const type of STOPPED_TYPES) {
		host.addEventListener(type, (e) => e.stopPropagation(), {
			passive: true,
			signal,
		});
	}

	// Captured at the host, so the viewer's own listeners can't stop the keys
	// and presses before.
	host.addEventListener(
		"keydown",
		(e) => {
			if (isScrollKey(e) && !isForFocusedElement(e, root)) e.preventDefault();
		},
		{ capture: true, signal },
	);

	// The keys of the page itself, with the focus out of the viewer. Hidden from
	// it, and kept from scrolling it.
	for (const type of KEY_TYPES) {
		window.addEventListener(
			type,
			(e) => {
				if (e.composedPath().includes(host)) return;

				if (isScrollKey(e)) e.preventDefault();
				e.stopImmediatePropagation();
			},
			{ capture: true, signal },
		);
	}

	// A press of the wheel would start autoscrolling the page.
	host.addEventListener(
		"mousedown",
		(e) => {
			if (e.button === POINTER_BUTTON.AUXILIARY) e.preventDefault();
		},
		{ capture: true, signal },
	);

	// At the window, not the host: Chrome tells whether a wheel can be prevented
	// by the box of the element with the listener, before the event is sent.
	// The host has none, the viewer is in the top layer, so the page would
	// scroll. Not passive, so only while the viewer is open. The viewer handles
	// the wheel itself.
	window.addEventListener("wheel", (e) => e.preventDefault(), {
		capture: true,
		passive: false,
		signal,
	});

	// Not right away: the event that closes the viewer may still be on its way,
	// e.g. Escape, and the page would see it once it bubbles past the host. A
	// timer runs after the dispatch.
	return () => {
		setTimeout(() => controller.abort());
	};
};
