import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ContextMenuTracker } from "./context-menu-tracker";

describe("ContextMenuTracker", () => {
	let tracker: ContextMenuTracker;

	const openMenu = (
		target: EventTarget,
		clientX: number,
		clientY: number,
		pointerType = "mouse",
	) =>
		target.dispatchEvent(
			new PointerEvent("contextmenu", {
				bubbles: true,
				cancelable: true,
				clientX,
				clientY,
				composed: true,
				pointerType,
			}),
		);

	beforeEach(() => {
		tracker = new ContextMenuTracker();
	});

	afterEach(() => {
		tracker.destroy();
	});

	it("has no point before a menu opens", () => {
		tracker.init();

		expect(tracker.point).toBeNull();
	});

	it.each(["mouse", "pen", "touch"])(
		"remembers the point of a menu opened by a %s",
		(pointerType) => {
			tracker.init();

			openMenu(document.body, 10, 20, pointerType);

			expect(tracker.point).toEqual({ x: 10, y: 20 });
		},
	);

	it("keeps the point of the last menu", () => {
		tracker.init();

		openMenu(document.body, 10, 20);
		openMenu(document.body, 30, 40);

		expect(tracker.point).toEqual({ x: 30, y: 40 });
	});

	it("sees the menu even if the page stops it at the window", () => {
		tracker.init();

		const stop = (e: Event) => e.stopImmediatePropagation();
		window.addEventListener("contextmenu", stop, { capture: true });

		openMenu(document.body, 10, 20);

		window.removeEventListener("contextmenu", stop, { capture: true });

		expect(tracker.point).toEqual({ x: 10, y: 20 });
	});

	it("sees the menu inside a shadow root", () => {
		tracker.init();

		const host = document.createElement("div");
		const root = host.attachShadow({ mode: "closed" });
		const child = document.createElement("span");
		root.append(child);
		document.body.append(host);

		openMenu(child, 10, 20);

		host.remove();

		expect(tracker.point).toEqual({ x: 10, y: 20 });
	});

	it("listens once when initialized twice", () => {
		tracker.init();
		tracker.init();
		tracker.destroy();

		openMenu(document.body, 10, 20);

		expect(tracker.point).toBeNull();
	});

	it("ignores menus before init", () => {
		openMenu(document.body, 10, 20);

		expect(tracker.point).toBeNull();
	});

	it("forgets the point and stops tracking on destroy", () => {
		tracker.init();
		openMenu(document.body, 10, 20);

		tracker.destroy();
		openMenu(document.body, 30, 40);

		expect(tracker.point).toBeNull();
	});
});
