import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type MockInstance,
	vi,
} from "vitest";
import { ScrollbarHider } from "./scrollbar-hider";

describe("ScrollbarHider", () => {
	let hider: ScrollbarHider;
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

	beforeEach(() => {
		setScrollbars({});
		setScrollPosition(0, 0);
		scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

		hider = new ScrollbarHider();
	});

	afterEach(() => {
		hider.restore();
		rootStyle.cssText = "";
		vi.restoreAllMocks();
	});

	describe("hide", () => {
		it("hides the scrollbars of the page", () => {
			hider.hide();

			expect(getStyle("scrollbar-width")).toEqual({
				priority: "important",
				value: "none",
			});
		});

		it("leaves the overflow of the page alone", () => {
			setScrollbars({ height: 15, width: 15 });

			hider.hide();

			expect(getStyle("overflow").value).toBe("");
		});

		it("replaces the vertical scrollbar with padding", () => {
			setScrollbars({ width: 15 });

			hider.hide();

			expect(getStyle("padding-right")).toEqual({
				priority: "important",
				value: "15px",
			});
		});

		it("adds the scrollbar to the padding of the page", () => {
			setScrollbars({ width: 15 });
			rootStyle.setProperty("padding-right", "10px");

			hider.hide();

			expect(getStyle("padding-right").value).toBe("25px");
		});

		it("adds no padding without a vertical scrollbar", () => {
			setScrollbars({ height: 15 });

			hider.hide();

			expect(getStyle("padding-right").value).toBe("");
		});

		it("extends the scrollable area by the scrollbars", () => {
			setScrollbars({ height: 12, width: 15 });

			hider.hide();

			expect(getScrollExtender()?.style.width).toBe("3015px");
			expect(getScrollExtender()?.style.height).toBe("5012px");
		});

		it("does not extend the scrollable area without scrollbars", () => {
			hider.hide();

			expect(getScrollExtender()).toBeNull();
		});

		it("does nothing when already hidden", () => {
			setScrollbars({ width: 15 });

			hider.hide();
			hider.hide();

			expect(getStyle("padding-right").value).toBe("15px");
			expect(
				document.querySelectorAll("swiftview-scroll-extender"),
			).toHaveLength(1);
		});
	});

	describe("restore", () => {
		it("removes the styles", () => {
			setScrollbars({ height: 15, width: 15 });

			hider.hide();
			hider.restore();

			expect(rootStyle.cssText).toBe("");
		});

		it("removes the scroll extender", () => {
			setScrollbars({ height: 15, width: 15 });

			hider.hide();
			hider.restore();

			expect(getScrollExtender()).toBeNull();
		});

		it("restores the inline styles of the page", () => {
			setScrollbars({ height: 15, width: 15 });
			rootStyle.setProperty("scrollbar-width", "thin", "important");
			rootStyle.setProperty("padding-right", "10px");

			hider.hide();
			hider.restore();

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
			hider.hide();

			// The browser scrolled the page back while the scrollbars were hidden.
			setScrollPosition(10, 485);
			hider.restore();

			expect(scrollTo).toHaveBeenCalledExactlyOnceWith({
				behavior: "instant",
				left: 10,
				top: 500,
			});
		});

		it("does not scroll when the position has not changed", () => {
			setScrollPosition(10, 500);

			hider.hide();
			hider.restore();

			expect(scrollTo).not.toHaveBeenCalled();
		});

		it("does nothing when not hidden", () => {
			rootStyle.setProperty("scrollbar-width", "thin");
			setScrollPosition(10, 500);

			hider.restore();

			expect(getStyle("scrollbar-width").value).toBe("thin");
			expect(scrollTo).not.toHaveBeenCalled();
		});

		it("allows hiding again", () => {
			setScrollbars({ width: 15 });

			hider.hide();
			hider.restore();
			hider.hide();

			expect(getStyle("padding-right").value).toBe("15px");
			expect(getScrollExtender()).not.toBeNull();
		});
	});
});
