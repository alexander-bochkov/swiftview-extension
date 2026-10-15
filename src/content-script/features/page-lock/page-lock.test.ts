import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type MockInstance,
	vi,
} from "vitest";
import { PageLock } from "./page-lock";

const TYPES = ["click", "keydown", "pointermove", "wheel"] as const;

describe("PageLock", () => {
	let host: HTMLElement;
	let lock: PageLock;
	let pageController: AbortController;
	let scrollTo: MockInstance<typeof window.scrollTo>;
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

	const setScrollPosition = (x: number, y: number) => {
		Object.defineProperty(window, "scrollX", { configurable: true, value: x });
		Object.defineProperty(window, "scrollY", { configurable: true, value: y });
	};

	beforeEach(() => {
		host = document.createElement("swiftview-root");
		document.documentElement.append(host);

		viewer = document.createElement("div");
		host.attachShadow({ mode: "closed" }).append(viewer);

		lock = new PageLock();
		pageController = new AbortController();
		scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

		setScrollPosition(0, 0);
	});

	afterEach(() => {
		lock.unlock();
		host.remove();
		pageController.abort();
		scrollTo.mockRestore();
	});

	describe("events of the page", () => {
		it.each(TYPES)("blocks %s", (type) => {
			const listener = listenOnPage(type);

			lock.lock(host);
			const e = dispatchOnPage(type);

			expect(e.defaultPrevented).toBe(true);
			expect(listener).not.toHaveBeenCalled();
		});

		it("does not block events that are not in the list", () => {
			const listener = listenOnPage("resize");

			lock.lock(host);
			const e = dispatchOnPage("resize");

			expect(e.defaultPrevented).toBe(false);
			expect(listener).toHaveBeenCalledOnce();
		});

		it("hides events from window listeners registered after the lock", () => {
			const laterListener = vi.fn();

			lock.lock(host);
			window.addEventListener("keydown", laterListener, {
				capture: true,
				signal: pageController.signal,
			});
			dispatchOnPage("keydown");

			expect(laterListener).not.toHaveBeenCalled();
		});
	});

	describe("events of the viewer", () => {
		it.each(TYPES)("lets %s reach the viewer but not the page", (type) => {
			const pageListener = listenOnPage(type);
			const viewerListener = listenOnViewer(type);

			lock.lock(host);
			dispatchOnViewer(type);

			expect(viewerListener).toHaveBeenCalledOnce();
			expect(pageListener).not.toHaveBeenCalled();
		});

		it("does not prevent the default action", () => {
			lock.lock(host);
			const e = dispatchOnViewer("keydown");

			expect(e.defaultPrevented).toBe(false);
		});

		it("prevents the default action of wheel, so the page doesn't scroll", () => {
			lock.lock(host);
			const e = dispatchOnViewer("wheel");

			expect(e.defaultPrevented).toBe(true);
		});

		it("keeps an event from the page when the viewer unlocks during it", () => {
			const pageListener = listenOnPage("keydown");
			viewer.addEventListener("keydown", () => lock.unlock());

			lock.lock(host);
			dispatchOnViewer("keydown");

			expect(pageListener).not.toHaveBeenCalled();
		});
	});

	describe("scroll", () => {
		it("restores the scroll position of the lock", () => {
			setScrollPosition(10, 20);
			lock.lock(host);

			setScrollPosition(10, 500);
			dispatch(document, "scroll");

			expect(scrollTo).toHaveBeenCalledExactlyOnceWith({
				behavior: "instant",
				left: 10,
				top: 20,
			});
		});

		it("does not scroll when the position has not changed", () => {
			lock.lock(host);
			dispatch(document, "scroll");

			expect(scrollTo).not.toHaveBeenCalled();
		});

		it("hides scroll events from the page", () => {
			const listener = listenOnPage("scroll");

			lock.lock(host);
			dispatch(document, "scroll");

			expect(listener).not.toHaveBeenCalled();
		});
	});

	describe("lock", () => {
		it("ignores a second lock while locked", () => {
			const other = document.createElement("div");
			document.body.append(other);

			lock.lock(host);
			lock.lock(other);
			const e = dispatch(other, "keydown");
			other.remove();

			expect(e.defaultPrevented).toBe(true);
		});
	});

	describe("unlock", () => {
		it("lets events of the page through again", () => {
			const listener = listenOnPage("click");

			lock.lock(host);
			lock.unlock();
			const e = dispatchOnPage("click");

			expect(e.defaultPrevented).toBe(false);
			expect(listener).toHaveBeenCalledOnce();
		});

		it("stops restoring the scroll position", () => {
			lock.lock(host);
			lock.unlock();

			setScrollPosition(0, 500);
			dispatch(document, "scroll");

			expect(scrollTo).not.toHaveBeenCalled();
		});

		it("does nothing when it was not locked", () => {
			expect(() => lock.unlock()).not.toThrow();
		});
	});

	describe("isLocked", () => {
		it("is false before lock", () => {
			expect(lock.isLocked).toBe(false);
		});

		it("is true after lock", () => {
			lock.lock(host);

			expect(lock.isLocked).toBe(true);
		});

		it("is false after unlock", () => {
			lock.lock(host);
			lock.unlock();

			expect(lock.isLocked).toBe(false);
		});
	});
});
