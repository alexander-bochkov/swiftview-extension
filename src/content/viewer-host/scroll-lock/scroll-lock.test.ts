import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type MockInstance,
	vi,
} from "vitest";
import { ScrollLock } from "./scroll-lock";

describe("ScrollLock", () => {
	let lock: ScrollLock;
	let scrollTo: MockInstance<typeof window.scrollTo>;

	const rootStyle = document.documentElement.style;

	const getStyle = (property: string) => ({
		priority: rootStyle.getPropertyPriority(property),
		value: rootStyle.getPropertyValue(property),
	});

	const getScrollExtender = () =>
		document.documentElement.querySelector<HTMLElement>(
			"swiftview-scroll-extender",
		);

	// jsdom has no layout, so a scrollbar is the difference of the viewport and
	// the client area. The page is 3000 × 5000.
	const setScrollbars = ({ height = 0, width = 0 }) => {
		const define = (target: object, property: string, value: number) =>
			Object.defineProperty(target, property, { configurable: true, value });

		define(window, "innerHeight", 800);
		define(window, "innerWidth", 1000);
		define(document.documentElement, "clientHeight", 800 - height);
		define(document.documentElement, "clientWidth", 1000 - width);
		define(document.documentElement, "scrollHeight", 5000);
		define(document.documentElement, "scrollWidth", 3000);
	};

	const setScrollPosition = (x: number, y: number) => {
		Object.defineProperty(window, "scrollX", { configurable: true, value: x });
		Object.defineProperty(window, "scrollY", { configurable: true, value: y });
	};

	// The viewer: a button in a shadow root, like the toolbar.
	let button: HTMLButtonElement;
	let host: HTMLElement;
	let root: ShadowRoot;

	const isPrevented = (target: EventTarget, event: Event): boolean => {
		target.dispatchEvent(event);

		return event.defaultPrevented;
	};

	const keyDown = (key: string, init: KeyboardEventInit = {}) =>
		new KeyboardEvent("keydown", {
			bubbles: true,
			cancelable: true,
			composed: true,
			key,
			...init,
		});

	beforeEach(() => {
		setScrollbars({});
		setScrollPosition(0, 0);
		scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

		host = document.createElement("div");
		root = host.attachShadow({ mode: "open" });
		button = document.createElement("button");
		root.append(button);
		document.body.append(host);

		lock = new ScrollLock();
	});

	afterEach(() => {
		lock.unlock();
		host.remove();
		rootStyle.cssText = "";
		vi.restoreAllMocks();
	});

	describe("scrolling", () => {
		it.each([
			" ",
			"ArrowDown",
			"ArrowLeft",
			"ArrowRight",
			"ArrowUp",
			"End",
			"Home",
			"PageDown",
			"PageUp",
		])("prevents %j in the viewer", (key) => {
			lock.lock(root);

			expect(isPrevented(root, keyDown(key))).toBe(true);
		});

		it("prevents a scroll key in the page", () => {
			lock.lock(root);

			expect(isPrevented(document.body, keyDown("ArrowDown"))).toBe(true);
		});

		it("prevents a scroll key with Ctrl or Shift", () => {
			lock.lock(root);

			expect(isPrevented(root, keyDown("End", { ctrlKey: true }))).toBe(true);
			expect(isPrevented(root, keyDown(" ", { shiftKey: true }))).toBe(true);
		});

		it("lets Space press a focused button of the viewer", () => {
			lock.lock(root);
			button.focus();

			expect(isPrevented(button, keyDown(" "))).toBe(false);
		});

		it("prevents the arrows on a focused button of the viewer", () => {
			lock.lock(root);
			button.focus();

			expect(isPrevented(button, keyDown("ArrowDown"))).toBe(true);
		});

		it.each([
			["Alt", { altKey: true }],
			["Meta", { metaKey: true }],
		])("leaves the browser shortcuts with %s", (_, init) => {
			lock.lock(root);

			expect(isPrevented(root, keyDown("ArrowLeft", init))).toBe(false);
		});

		it("leaves the keys that don't scroll", () => {
			lock.lock(root);

			expect(isPrevented(root, keyDown("Enter"))).toBe(false);
			expect(isPrevented(root, keyDown("t"))).toBe(false);
		});

		it("prevents the wheel", () => {
			lock.lock(root);

			const wheel = new WheelEvent("wheel", {
				bubbles: true,
				cancelable: true,
				composed: true,
				deltaY: 100,
			});

			expect(isPrevented(root, wheel)).toBe(true);
		});

		it("prevents a press of the wheel, which would start autoscrolling", () => {
			lock.lock(root);

			const press = (button: number) =>
				new MouseEvent("mousedown", {
					bubbles: true,
					button,
					cancelable: true,
					composed: true,
				});

			expect(isPrevented(root, press(1))).toBe(true);
			expect(isPrevented(root, press(0))).toBe(false);
		});

		it("doesn't stop the events", () => {
			const listener = vi.fn();
			document.addEventListener("keydown", listener);

			lock.lock(root);
			root.dispatchEvent(keyDown("ArrowDown"));

			document.removeEventListener("keydown", listener);

			expect(listener).toHaveBeenCalledOnce();
		});

		it("is allowed again after unlock", () => {
			lock.lock(root);
			lock.unlock();

			expect(isPrevented(root, keyDown("ArrowDown"))).toBe(false);
		});
	});

	describe("lock", () => {
		it("hides the scrollbars of the page", () => {
			lock.lock(root);

			expect(getStyle("scrollbar-width")).toEqual({
				priority: "important",
				value: "none",
			});
		});

		it("leaves the overflow of the page alone", () => {
			setScrollbars({ height: 15, width: 15 });

			lock.lock(root);

			expect(getStyle("overflow").value).toBe("");
		});

		it("replaces the vertical scrollbar with padding", () => {
			setScrollbars({ width: 15 });

			lock.lock(root);

			expect(getStyle("padding-right")).toEqual({
				priority: "important",
				value: "15px",
			});
		});

		it("adds the scrollbar to the padding of the page", () => {
			setScrollbars({ width: 15 });
			rootStyle.setProperty("padding-right", "10px");

			lock.lock(root);

			expect(getStyle("padding-right").value).toBe("25px");
		});

		it("adds no padding without a vertical scrollbar", () => {
			setScrollbars({ height: 15 });

			lock.lock(root);

			expect(getStyle("padding-right").value).toBe("");
		});

		it("extends the scrollable area by the scrollbars", () => {
			setScrollbars({ height: 12, width: 15 });

			lock.lock(root);

			expect(getScrollExtender()?.style.width).toBe("3015px");
			expect(getScrollExtender()?.style.height).toBe("5012px");
		});

		it("does not extend the scrollable area without scrollbars", () => {
			lock.lock(root);

			expect(getScrollExtender()).toBeNull();
		});

		it("does nothing when already locked", () => {
			setScrollbars({ width: 15 });

			lock.lock(root);
			lock.lock(root);

			expect(getStyle("padding-right").value).toBe("15px");
			expect(
				document.querySelectorAll("swiftview-scroll-extender"),
			).toHaveLength(1);
		});
	});

	describe("unlock", () => {
		it("removes the styles", () => {
			setScrollbars({ height: 15, width: 15 });

			lock.lock(root);
			lock.unlock();

			expect(rootStyle.cssText).toBe("");
		});

		it("removes the scroll extender", () => {
			setScrollbars({ height: 15, width: 15 });

			lock.lock(root);
			lock.unlock();

			expect(getScrollExtender()).toBeNull();
		});

		it("restores the inline styles of the page", () => {
			setScrollbars({ height: 15, width: 15 });
			rootStyle.setProperty("scrollbar-width", "thin", "important");
			rootStyle.setProperty("padding-right", "10px");

			lock.lock(root);
			lock.unlock();

			expect(getStyle("scrollbar-width")).toEqual({
				priority: "important",
				value: "thin",
			});
			expect(getStyle("padding-right")).toEqual({
				priority: "",
				value: "10px",
			});
		});

		it("restores the scroll position", () => {
			setScrollPosition(10, 500);
			lock.lock(root);

			// The browser scrolled the page back while it was locked.
			setScrollPosition(10, 485);
			lock.unlock();

			expect(scrollTo).toHaveBeenCalledExactlyOnceWith({
				behavior: "instant",
				left: 10,
				top: 500,
			});
		});

		it("does not scroll when the position has not changed", () => {
			setScrollPosition(10, 500);

			lock.lock(root);
			lock.unlock();

			expect(scrollTo).not.toHaveBeenCalled();
		});

		it("does nothing when not locked", () => {
			rootStyle.setProperty("scrollbar-width", "thin");
			setScrollPosition(10, 500);

			lock.unlock();

			expect(getStyle("scrollbar-width").value).toBe("thin");
			expect(scrollTo).not.toHaveBeenCalled();
		});

		it("allows locking again", () => {
			setScrollbars({ width: 15 });

			lock.lock(root);
			lock.unlock();
			lock.lock(root);

			expect(getStyle("padding-right").value).toBe("15px");
			expect(getScrollExtender()).not.toBeNull();
		});
	});
});
