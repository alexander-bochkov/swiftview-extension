import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventBlocker } from "./event-blocker";

const TYPES = ["click", "pointermove"] as const;

describe("EventBlocker", () => {
	let blocker: EventBlocker;
	let pageController: AbortController;

	// Stands for the page: a listener on an element below the window.
	const listenOnPage = (type: string) => {
		const listener = vi.fn();

		document.body.addEventListener(type, listener, {
			signal: pageController.signal,
		});

		return listener;
	};

	const dispatch = (type: string): Event => {
		const e = new Event(type, { bubbles: true, cancelable: true });
		document.body.dispatchEvent(e);

		return e;
	};

	beforeEach(() => {
		blocker = new EventBlocker();
		pageController = new AbortController();
	});

	afterEach(() => {
		blocker.stop();
		pageController.abort();
	});

	describe("start", () => {
		it.each(TYPES)("blocks %s before it reaches the page", (type) => {
			const listener = listenOnPage(type);

			blocker.start(TYPES);
			const e = dispatch(type);

			expect(e.defaultPrevented).toBe(true);
			expect(listener).not.toHaveBeenCalled();
		});

		it("does not block events that are not in the list", () => {
			const listener = listenOnPage("keydown");

			blocker.start(TYPES);
			const e = dispatch("keydown");

			expect(e.defaultPrevented).toBe(false);
			expect(listener).toHaveBeenCalledOnce();
		});

		it("hides the event from window listeners registered after it", () => {
			const laterListener = vi.fn();

			blocker.start(TYPES);
			window.addEventListener("click", laterListener, {
				capture: true,
				signal: pageController.signal,
			});
			dispatch("click");

			expect(laterListener).not.toHaveBeenCalled();
		});

		it("ignores a second start while active", () => {
			const click = listenOnPage("click");
			const pointermove = listenOnPage("pointermove");

			blocker.start(["click"]);
			blocker.start(["pointermove"]);
			dispatch("click");
			dispatch("pointermove");

			expect(click).not.toHaveBeenCalled();
			expect(pointermove).toHaveBeenCalledOnce();
		});
	});

	describe("stop", () => {
		it("lets events through again", () => {
			const listener = listenOnPage("click");

			blocker.start(TYPES);
			blocker.stop();
			const e = dispatch("click");

			expect(e.defaultPrevented).toBe(false);
			expect(listener).toHaveBeenCalledOnce();
		});

		it("does nothing when it was not started", () => {
			expect(() => blocker.stop()).not.toThrow();
		});

		it("allows starting again with another list", () => {
			const click = listenOnPage("click");
			const pointermove = listenOnPage("pointermove");

			blocker.start(["click"]);
			blocker.stop();
			blocker.start(["pointermove"]);
			dispatch("click");
			dispatch("pointermove");

			expect(click).toHaveBeenCalledOnce();
			expect(pointermove).not.toHaveBeenCalled();
		});
	});

	describe("isActive", () => {
		it("is false before start", () => {
			expect(blocker.isActive).toBe(false);
		});

		it("is true after start", () => {
			blocker.start(TYPES);

			expect(blocker.isActive).toBe(true);
		});

		it("is false after stop", () => {
			blocker.start(TYPES);
			blocker.stop();

			expect(blocker.isActive).toBe(false);
		});
	});
});
