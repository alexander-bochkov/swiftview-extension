import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { exitElementFullscreen } from "./exit-element-fullscreen";

describe("exitElementFullscreen", () => {
	const exitFullscreen = vi.fn(() => Promise.resolve());

	// jsdom doesn't implement the Fullscreen API.
	const setFullscreen = (element: Element | null) =>
		Object.defineProperty(document, "fullscreenElement", {
			configurable: true,
			value: element,
		});

	beforeEach(() => {
		document.exitFullscreen = exitFullscreen;
	});

	afterEach(() => {
		Reflect.deleteProperty(document, "fullscreenElement");
		Reflect.deleteProperty(document, "exitFullscreen");
		exitFullscreen.mockClear();
	});

	it("exits the fullscreen of a page element", async () => {
		setFullscreen(document.createElement("video"));

		await exitElementFullscreen();

		expect(exitFullscreen).toHaveBeenCalledOnce();
	});

	// The fullscreen of the browser itself (F11) has no element.
	it("leaves the fullscreen of the browser", async () => {
		setFullscreen(null);

		await exitElementFullscreen();

		expect(exitFullscreen).not.toHaveBeenCalled();
	});
});
