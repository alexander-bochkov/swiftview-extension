import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POINTER_BUTTON } from "@/shared/constants";
import { isolateViewer } from "./isolate-viewer";

// Not in POINTER_BUTTON, as the code has no use for it.
const SECONDARY_BUTTON = 2;

const SCROLL_KEYS = [
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
];

const key = (
	type: "keydown" | "keypress" | "keyup",
	name: string,
	init: KeyboardEventInit = {},
) =>
	new KeyboardEvent(type, {
		bubbles: true,
		cancelable: true,
		composed: true,
		key: name,
		...init,
	});

const keyDown = (name: string, init?: KeyboardEventInit) =>
	key("keydown", name, init);

const mouse = (type: string, button: number) =>
	new MouseEvent(type, {
		bubbles: true,
		button,
		cancelable: true,
		composed: true,
	});

const wheel = () =>
	new WheelEvent("wheel", { bubbles: true, cancelable: true, composed: true });

const isPrevented = (target: EventTarget, event: Event): boolean => {
	target.dispatchEvent(event);

	return event.defaultPrevented;
};

// The stop is done by a timer, see isolateViewer().
const flushTimers = () => new Promise((resolve) => setTimeout(resolve));

describe("isolateViewer", () => {
	// The viewer: a button in a shadow root, like the toolbar.
	let button: HTMLButtonElement;
	let host: HTMLElement;
	let root: ShadowRoot;
	let stop: () => void;
	// Stands for the page and its listeners.
	let pageController: AbortController;

	const listenOnDocument = (type: string, capture = false) => {
		const listener = vi.fn();

		document.addEventListener(type, listener, {
			capture,
			signal: pageController.signal,
		});

		return listener;
	};

	beforeEach(() => {
		host = document.createElement("div");
		root = host.attachShadow({ mode: "open" });
		button = document.createElement("button");
		root.append(button);
		document.body.append(host);
		pageController = new AbortController();

		stop = isolateViewer(root);
	});

	afterEach(async () => {
		stop();
		await flushTimers();
		pageController.abort();
		host.remove();
		vi.restoreAllMocks();
	});

	describe("events", () => {
		it.each(STOPPED_TYPES)("hides %s of the viewer from the page", (type) => {
			const listener = listenOnDocument(type);

			button.dispatchEvent(new Event(type, { bubbles: true, composed: true }));

			expect(listener).not.toHaveBeenCalled();
		});

		it("lets the events reach the viewer", () => {
			const listener = vi.fn();
			button.addEventListener("click", listener);

			button.dispatchEvent(mouse("click", POINTER_BUTTON.MAIN));

			expect(listener).toHaveBeenCalledOnce();
		});

		it("leaves the pointer moves to the page", () => {
			const listener = listenOnDocument("pointermove");

			button.dispatchEvent(
				new Event("pointermove", { bubbles: true, composed: true }),
			);

			expect(listener).toHaveBeenCalledOnce();
		});

		// They come before the host, see isolateViewer().
		it("can't hide them from the capture listeners of the page", () => {
			const listener = listenOnDocument("click", true);

			button.dispatchEvent(mouse("click", POINTER_BUTTON.MAIN));

			expect(listener).toHaveBeenCalledOnce();
		});

		it("leaves the context menu of the browser", () => {
			expect(isPrevented(button, mouse("contextmenu", SECONDARY_BUTTON))).toBe(
				false,
			);
		});

		it("leaves the events of the page", () => {
			const listener = listenOnDocument("click");

			document.body.dispatchEvent(mouse("click", POINTER_BUTTON.MAIN));

			expect(listener).toHaveBeenCalledOnce();
		});
	});

	describe("keys", () => {
		it.each(SCROLL_KEYS)("prevents %j", (name) => {
			expect(isPrevented(button, keyDown(name))).toBe(true);
		});

		it("prevents a scroll key with Ctrl or Shift", () => {
			expect(isPrevented(button, keyDown("End", { ctrlKey: true }))).toBe(true);
			expect(isPrevented(button, keyDown(" ", { shiftKey: true }))).toBe(true);
		});

		it.each([
			["Alt", { altKey: true }],
			["Meta", { metaKey: true }],
		])("leaves the browser shortcuts with %s", (_, init) => {
			expect(isPrevented(button, keyDown("ArrowLeft", init))).toBe(false);
		});

		it("leaves the keys that don't scroll", () => {
			expect(isPrevented(button, keyDown("Enter"))).toBe(false);
			expect(isPrevented(button, keyDown("t"))).toBe(false);
		});

		it("leaves keypress and keyup of a scroll key", () => {
			expect(isPrevented(button, key("keypress", " "))).toBe(false);
			expect(isPrevented(button, key("keyup", "ArrowDown"))).toBe(false);
		});

		it("lets Space press a focused button", () => {
			button.focus();

			expect(isPrevented(button, keyDown(" "))).toBe(false);
		});

		it("prevents the arrows on a focused button", () => {
			button.focus();

			expect(isPrevented(button, keyDown("ArrowDown"))).toBe(true);
		});

		// Before the viewer's own listeners, which may stop the key.
		it("prevents a key that the viewer stops", () => {
			button.addEventListener("keydown", (e) => e.stopPropagation());

			expect(isPrevented(button, keyDown("ArrowDown"))).toBe(true);
		});

		describe("of the page, with the focus out of the viewer", () => {
			it.each(["keydown", "keypress", "keyup"] as const)(
				"hides %s from the page",
				(type) => {
					const listener = listenOnDocument(type, true);

					document.body.dispatchEvent(key(type, "t"));

					expect(listener).not.toHaveBeenCalled();
				},
			);

			it("prevents a scroll key", () => {
				expect(isPrevented(document.body, keyDown("ArrowDown"))).toBe(true);
			});

			it("prevents Space, as a focused element of the page would get it", () => {
				expect(isPrevented(document.body, keyDown(" "))).toBe(true);
			});

			it("leaves the browser shortcuts", () => {
				expect(
					isPrevented(document.body, keyDown("ArrowLeft", { altKey: true })),
				).toBe(false);
			});
		});

		describe("on a focused video", () => {
			let video: HTMLVideoElement;

			beforeEach(() => {
				video = document.createElement("video");
				// Focusable in jsdom, as a video with controls is in the browser.
				video.tabIndex = 0;
				root.append(video);
				video.focus();
			});

			it.each([" ", "ArrowLeft", "ArrowUp", "End", "Home"])(
				"leaves %j, which the video handles",
				(name) => {
					expect(isPrevented(video, keyDown(name))).toBe(false);
				},
			);

			it.each(["PageDown", "PageUp"])(
				"prevents %s, which only scrolls",
				(name) => {
					expect(isPrevented(video, keyDown(name))).toBe(true);
				},
			);
		});
	});

	describe("mouse", () => {
		it("prevents a press of the wheel", () => {
			expect(
				isPrevented(button, mouse("mousedown", POINTER_BUTTON.AUXILIARY)),
			).toBe(true);
		});

		it("leaves a press of the main button", () => {
			expect(isPrevented(button, mouse("mousedown", POINTER_BUTTON.MAIN))).toBe(
				false,
			);
		});

		it.each(["auxclick", "mouseup"])("leaves %s of the wheel", (type) => {
			expect(isPrevented(button, mouse(type, POINTER_BUTTON.AUXILIARY))).toBe(
				false,
			);
		});

		it("prevents the wheel", () => {
			expect(isPrevented(button, wheel())).toBe(true);
		});

		// See isolateViewer() for why at the window.
		it("listens to the wheel at the window, not passively", async () => {
			stop();
			await flushTimers();
			const addEventListener = vi.spyOn(window, "addEventListener");

			stop = isolateViewer(root);

			expect(addEventListener).toHaveBeenCalledWith(
				"wheel",
				expect.any(Function),
				expect.objectContaining({ capture: true, passive: false }),
			);
		});
	});

	describe("stopped", () => {
		// E.g. the Escape that closes the viewer, see isolateViewer().
		it("still hides an event of the viewer on its way", () => {
			const listener = listenOnDocument("keydown");
			button.addEventListener("keydown", () => stop());

			button.dispatchEvent(keyDown("Escape"));

			expect(listener).not.toHaveBeenCalled();
		});

		describe("after the dispatch", () => {
			beforeEach(async () => {
				stop();
				await flushTimers();
			});

			it("lets the events of the viewer reach the page", () => {
				const listener = listenOnDocument("click");

				button.dispatchEvent(mouse("click", POINTER_BUTTON.MAIN));

				expect(listener).toHaveBeenCalledOnce();
			});

			it("leaves the keys", () => {
				expect(isPrevented(button, keyDown("ArrowDown"))).toBe(false);
			});

			it("lets the keys of the page reach it", () => {
				const listener = listenOnDocument("keydown");

				expect(isPrevented(document.body, keyDown("ArrowDown"))).toBe(false);
				expect(listener).toHaveBeenCalledOnce();
			});

			it("leaves a press of the wheel", () => {
				expect(
					isPrevented(button, mouse("mousedown", POINTER_BUTTON.AUXILIARY)),
				).toBe(false);
			});

			it("leaves the wheel", () => {
				expect(isPrevented(button, wheel())).toBe(false);
			});
		});
	});
});
