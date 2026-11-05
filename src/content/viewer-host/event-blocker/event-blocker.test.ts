import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventBlocker } from "./event-blocker";

const TYPES = ["click", "keydown", "pointermove", "wheel"] as const;

describe("EventBlocker", () => {
	let blocker: EventBlocker;
	let host: HTMLElement;
	let pageController: AbortController;
	// Stands for the viewer: an element inside the closed shadow root.
	let viewer: HTMLElement;

	// Stands for the page: a listener on the document, which sees the events
	// of the page and, through bubbling, of the viewer.
	const listenOnPage = (type: string) => {
		const listener = vi.fn();

		document.addEventListener(type, listener, {
			signal: pageController.signal,
		});

		return listener;
	};

	const listenOnViewer = (type: string) => {
		const listener = vi.fn();

		viewer.addEventListener(type, listener);

		return listener;
	};

	const dispatch = (target: EventTarget, type: string): Event => {
		const e = new Event(type, {
			bubbles: true,
			cancelable: true,
			composed: true,
		});
		target.dispatchEvent(e);

		return e;
	};

	const dispatchOnPage = (type: string) => dispatch(document.body, type);
	const dispatchOnViewer = (type: string) => dispatch(viewer, type);

	beforeEach(() => {
		host = document.createElement("swiftview-root");
		document.documentElement.append(host);

		viewer = document.createElement("div");
		host.attachShadow({ mode: "closed" }).append(viewer);

		blocker = new EventBlocker();
		pageController = new AbortController();
	});

	afterEach(() => {
		blocker.unblock();
		host.remove();
		pageController.abort();
	});

	describe("events of the page", () => {
		it.each(TYPES)("hides %s from the page", (type) => {
			const listener = listenOnPage(type);

			blocker.block(TYPES, host);
			dispatchOnPage(type);

			expect(listener).not.toHaveBeenCalled();
		});

		it("leaves the default action to the browser", () => {
			blocker.block(TYPES, host);
			const e = dispatchOnPage("keydown");

			expect(e.defaultPrevented).toBe(false);
		});

		it("lets the events that are not in the list through", () => {
			const listener = listenOnPage("resize");

			blocker.block(TYPES, host);
			dispatchOnPage("resize");

			expect(listener).toHaveBeenCalledOnce();
		});

		it("hides events from window listeners registered after the block", () => {
			const laterListener = vi.fn();

			blocker.block(TYPES, host);
			window.addEventListener("keydown", laterListener, {
				capture: true,
				signal: pageController.signal,
			});
			dispatchOnPage("keydown");

			expect(laterListener).not.toHaveBeenCalled();
		});
	});

	describe("events of the host", () => {
		it.each(TYPES)("lets %s reach the viewer but not the page", (type) => {
			const pageListener = listenOnPage(type);
			const viewerListener = listenOnViewer(type);

			blocker.block(TYPES, host);
			dispatchOnViewer(type);

			expect(viewerListener).toHaveBeenCalledOnce();
			expect(pageListener).not.toHaveBeenCalled();
		});

		it("leaves the default action to the browser", () => {
			blocker.block(TYPES, host);
			const e = dispatchOnViewer("keydown");

			expect(e.defaultPrevented).toBe(false);
		});

		it("keeps an event from the page when the viewer unblocks during it", () => {
			const pageListener = listenOnPage("keydown");
			viewer.addEventListener("keydown", () => blocker.unblock());

			blocker.block(TYPES, host);
			dispatchOnViewer("keydown");

			expect(pageListener).not.toHaveBeenCalled();
		});
	});

	describe("block", () => {
		it("ignores a second block while blocking", () => {
			const other = document.createElement("div");
			document.body.append(other);
			const listener = listenOnPage("keydown");

			blocker.block(TYPES, host);
			blocker.block(TYPES, other);
			dispatch(other, "keydown");
			other.remove();

			expect(listener).not.toHaveBeenCalled();
		});
	});

	describe("unblock", () => {
		it("lets the events of the page through again", () => {
			const listener = listenOnPage("click");

			blocker.block(TYPES, host);
			blocker.unblock();
			dispatchOnPage("click");

			expect(listener).toHaveBeenCalledOnce();
		});

		it("does nothing when it was not blocking", () => {
			expect(() => blocker.unblock()).not.toThrow();
		});
	});
});
