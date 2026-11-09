import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventBlocker } from "./event-blocker";

const TYPES = ["click", "keydown", "pointermove", "wheel"] as const;

describe("EventBlocker", () => {
	let blocker: EventBlocker<(typeof TYPES)[number]>;
	let host: HTMLElement;
	let pageController: AbortController;
	let root: ShadowRoot;
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

	// Stands for the page: a capture listener it adds to the window.
	const listenOnWindow = (type: string) => {
		const listener = vi.fn();

		window.addEventListener(type, listener, {
			capture: true,
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
		root = host.attachShadow({ mode: "closed" });
		root.append(viewer);

		blocker = new EventBlocker({ types: TYPES });
		pageController = new AbortController();
	});

	afterEach(() => {
		blocker.destroy();
		host.remove();
		pageController.abort();
	});

	describe("events of the page", () => {
		it.each(TYPES)("hides %s from the page", (type) => {
			const listener = listenOnPage(type);

			blocker.block(root);
			dispatchOnPage(type);

			expect(listener).not.toHaveBeenCalled();
		});

		it("leaves the default action to the browser", () => {
			blocker.block(root);
			const e = dispatchOnPage("keydown");

			expect(e.defaultPrevented).toBe(false);
		});

		it("lets the events that are not in the list through", () => {
			const listener = listenOnPage("resize");

			blocker.block(root);
			dispatchOnPage("resize");

			expect(listener).toHaveBeenCalledOnce();
		});

		it("hides events from window listeners registered after the block", () => {
			const laterListener = vi.fn();

			blocker.block(root);
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

			blocker.block(root);
			dispatchOnViewer(type);

			expect(viewerListener).toHaveBeenCalledOnce();
			expect(pageListener).not.toHaveBeenCalled();
		});

		it("leaves the default action to the browser", () => {
			blocker.block(root);
			const e = dispatchOnViewer("keydown");

			expect(e.defaultPrevented).toBe(false);
		});

		it("keeps an event from the page when the viewer unblocks during it", () => {
			const pageListener = listenOnPage("keydown");
			viewer.addEventListener("keydown", () => blocker.unblock());

			blocker.block(root);
			dispatchOnViewer("keydown");

			expect(pageListener).not.toHaveBeenCalled();
		});
	});

	describe("shouldPrevent", () => {
		const shouldPrevent = vi.fn((e: Event) => e.type === "keydown");

		beforeEach(() => {
			shouldPrevent.mockClear();
			blocker = new EventBlocker({ shouldPrevent, types: TYPES });
		});

		it("prevents the events of the page it returns true for", () => {
			blocker.block(root);

			expect(dispatchOnPage("keydown").defaultPrevented).toBe(true);
			expect(dispatchOnPage("click").defaultPrevented).toBe(false);
		});

		it("prevents the events of the viewer it returns true for", () => {
			blocker.block(root);

			expect(dispatchOnViewer("keydown").defaultPrevented).toBe(true);
			expect(dispatchOnViewer("click").defaultPrevented).toBe(false);
		});

		it("gets the event and the root", () => {
			blocker.block(root);
			const e = dispatchOnViewer("keydown");

			expect(shouldPrevent).toHaveBeenCalledExactlyOnceWith(e, root);
		});

		it("is not called after unblock", () => {
			blocker.block(root);
			blocker.unblock();
			const e = dispatchOnPage("keydown");

			expect(shouldPrevent).not.toHaveBeenCalled();
			expect(e.defaultPrevented).toBe(false);
		});
	});

	describe("init", () => {
		it("hides events from window listeners added after init", () => {
			blocker.init();
			const listener = listenOnWindow("keydown");

			blocker.block(root);
			dispatchOnPage("keydown");

			expect(listener).not.toHaveBeenCalled();
		});

		it("can't hide events from window listeners added before the block without init", () => {
			const listener = listenOnWindow("keydown");

			blocker.block(root);
			dispatchOnPage("keydown");

			expect(listener).toHaveBeenCalledOnce();
		});

		it("lets the events through until the block", () => {
			const shouldPrevent = vi.fn(() => true);
			blocker = new EventBlocker({ shouldPrevent, types: TYPES });
			const listener = listenOnPage("keydown");

			blocker.init();
			const e = dispatchOnPage("keydown");

			expect(listener).toHaveBeenCalledOnce();
			expect(shouldPrevent).not.toHaveBeenCalled();
			expect(e.defaultPrevented).toBe(false);
		});

		it("keeps the listeners after unblock", () => {
			blocker.init();
			const listener = listenOnWindow("keydown");

			blocker.block(root);
			blocker.unblock();
			blocker.block(root);
			dispatchOnPage("keydown");

			expect(listener).not.toHaveBeenCalled();
		});

		it("lets the events through after unblock", () => {
			const listener = listenOnPage("keydown");

			blocker.init();
			blocker.block(root);
			blocker.unblock();
			dispatchOnPage("keydown");

			expect(listener).toHaveBeenCalledOnce();
		});

		it("adds the listeners once when called twice", () => {
			const shouldPrevent = vi.fn(() => false);
			blocker = new EventBlocker({ shouldPrevent, types: TYPES });

			blocker.init();
			blocker.init();
			blocker.block(root);
			dispatchOnPage("keydown");

			expect(shouldPrevent).toHaveBeenCalledOnce();
		});
	});

	describe("destroy", () => {
		it("stops blocking", () => {
			const listener = listenOnPage("keydown");

			blocker.init();
			blocker.block(root);
			blocker.destroy();
			dispatchOnPage("keydown");

			expect(listener).toHaveBeenCalledOnce();
		});

		it("removes the listeners added by init", () => {
			blocker.init();
			blocker.destroy();
			// Added before the block, now that the blocker listens again from it.
			const listener = listenOnWindow("keydown");

			blocker.block(root);
			dispatchOnPage("keydown");

			expect(listener).toHaveBeenCalledOnce();
		});

		it("does nothing when it was not initialized", () => {
			expect(() => blocker.destroy()).not.toThrow();
		});
	});

	describe("block", () => {
		it("ignores a second block while blocking", () => {
			const otherHost = document.createElement("div");
			const otherViewer = document.createElement("div");
			const otherRoot = otherHost.attachShadow({ mode: "closed" });
			otherRoot.append(otherViewer);
			document.body.append(otherHost);
			const listener = listenOnPage("keydown");

			blocker.block(root);
			blocker.block(otherRoot);
			dispatch(otherViewer, "keydown");
			otherHost.remove();

			expect(listener).not.toHaveBeenCalled();
		});
	});

	describe("unblock", () => {
		it("lets the events of the page through again", () => {
			const listener = listenOnPage("click");

			blocker.block(root);
			blocker.unblock();
			dispatchOnPage("click");

			expect(listener).toHaveBeenCalledOnce();
		});

		it("does nothing when it was not blocking", () => {
			expect(() => blocker.unblock()).not.toThrow();
		});
	});
});
