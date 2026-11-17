// @vitest-environment jsdom

import { act, useEffect } from "react";
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	type MockInstance,
	vi,
} from "vitest";
import { ContentScriptContext } from "wxt/utils/content-script-context";
import { MEDIA_TYPE } from "@/shared/constants";
import type { MediaCandidate } from "@/shared/types";
import { FONT_FAMILY } from "./fonts";
import { ViewerHost } from "./viewer-host";

type ViewerProps = {
	readonly candidates: readonly MediaCandidate[];
	readonly onClose: () => void;
};

const mocks = vi.hoisted(() => ({
	MediaViewer: vi.fn(),
	onUnmount: vi.fn(),
}));

vi.mock("../media-viewer", () => ({ MediaViewer: mocks.MediaViewer }));

const PHOTO: MediaCandidate = {
	type: MEDIA_TYPE.IMAGE,
	url: "https://example.com/photo.png",
};
const CLIP: MediaCandidate = {
	type: MEDIA_TYPE.VIDEO,
	url: "https://example.com/clip.mp4",
};

// Reports the unmount through the cleanup of an effect.
const FakeViewer = (): null => {
	useEffect(() => mocks.onUnmount, []);

	return null;
};

describe("ViewerHost", () => {
	let consoleError: MockInstance<typeof console.error>;
	let ctx: ContentScriptContext;
	let pageController: AbortController;
	let viewerHost: ViewerHost;

	const getHosts = () =>
		document.documentElement.querySelectorAll("swiftview-root");

	const getViewerProps = (): ViewerProps => {
		const props = mocks.MediaViewer.mock.lastCall?.[0];
		if (!props) throw new Error("Viewer was not rendered");

		return props;
	};

	// React renders inside act, so the render has finished when it returns.
	const open = async (candidates: readonly MediaCandidate[] = [PHOTO]) => {
		await act(() => viewerHost.open(candidates));
	};

	const close = () => {
		act(() => viewerHost.close());
	};

	// Stands for the page: a keydown listener on the document.
	const listenOnPage = () => {
		const listener = vi.fn();

		document.addEventListener("keydown", listener, {
			signal: pageController.signal,
		});

		return listener;
	};

	const pressKey = (target: EventTarget, key: string): KeyboardEvent => {
		const e = new KeyboardEvent("keydown", {
			bubbles: true,
			cancelable: true,
			composed: true,
			key,
		});
		target.dispatchEvent(e);

		return e;
	};

	// Checks the page is back to normal: it sees its events and can scroll.
	const expectPageUnlocked = () => {
		const listener = listenOnPage();
		const e = pressKey(document.body, "ArrowDown");

		expect(listener).toHaveBeenCalledOnce();
		expect(e.defaultPrevented).toBe(false);
	};

	beforeAll(() => {
		Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
	});

	// jsdom doesn't implement fonts, so the fonts of the document are a plain
	// set of the created faces.
	let fonts: Set<FontFace>;

	beforeEach(() => {
		consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
		mocks.MediaViewer.mockImplementation(FakeViewer);

		fonts = new Set();
		vi.stubGlobal(
			"FontFace",
			class {
				descriptors: FontFaceDescriptors;
				family: string;
				source: string;

				constructor(
					family: string,
					source: string,
					descriptors: FontFaceDescriptors,
				) {
					this.descriptors = descriptors;
					this.family = family;
					this.source = source;
				}
			},
		);
		Object.defineProperty(document, "fonts", {
			configurable: true,
			value: fonts,
		});

		pageController = new AbortController();
		// Without the options of the script, WXT loads no styles.
		ctx = new ContentScriptContext("top-frame");
		viewerHost = new ViewerHost(ctx);
	});

	afterEach(() => {
		act(() => viewerHost.destroy());
		// Before the next test starts a newer copy, which would invalidate it.
		ctx.abort();
		pageController.abort();

		for (const host of getHosts()) host.remove();

		Reflect.deleteProperty(document, "fonts");
		vi.unstubAllGlobals();
		vi.clearAllMocks();
		consoleError.mockRestore();
	});

	describe("isOpen", () => {
		it("is false before open", () => {
			expect(viewerHost.isOpen).toBe(false);
		});

		it("is true after open", async () => {
			await open();

			expect(viewerHost.isOpen).toBe(true);
		});

		it("is false after close", async () => {
			await open();
			close();

			expect(viewerHost.isOpen).toBe(false);
		});
	});

	describe("init", () => {
		// Stands for the page: a capture listener it adds to the window after the
		// content script ran.
		const listenOnWindow = (type: string) => {
			const listener = vi.fn();

			window.addEventListener(type, listener, {
				capture: true,
				signal: pageController.signal,
			});

			return listener;
		};

		it("hides the keys from window listeners the page added after it", async () => {
			viewerHost.init();
			const listener = listenOnWindow("keydown");

			await open();
			pressKey(document.body, "t");

			expect(listener).not.toHaveBeenCalled();
		});

		it("hides the mouse buttons from window listeners the page added after it", async () => {
			viewerHost.init();
			const listener = listenOnWindow("mousedown");

			await open();
			document.body.dispatchEvent(
				new MouseEvent("mousedown", { bubbles: true, composed: true }),
			);

			expect(listener).not.toHaveBeenCalled();
		});

		it("leaves the page alone while nothing is open", () => {
			viewerHost.init();

			expectPageUnlocked();
		});
	});

	describe("destroy", () => {
		it("closes the viewer", async () => {
			await open();
			act(() => viewerHost.destroy());

			expect(viewerHost.isOpen).toBe(false);
			expect(getHosts()).toHaveLength(0);
		});

		it("unlocks the page", async () => {
			viewerHost.init();
			await open();
			act(() => viewerHost.destroy());

			expectPageUnlocked();
		});
	});

	describe("open", () => {
		it("adds one host to the document element", async () => {
			await open();

			expect(getHosts()).toHaveLength(1);
			expect(getHosts()[0]?.parentElement).toBe(document.documentElement);
		});

		it("attaches a closed shadow root", async () => {
			await open();

			// A closed shadow root is not reachable through the host.
			expect(getHosts()[0]?.shadowRoot).toBeNull();
		});

		it("renders the viewer with the candidates", async () => {
			await open([CLIP, PHOTO]);

			expect(getViewerProps().candidates).toEqual([CLIP, PHOTO]);
		});

		it("hides the events of the page from the page", async () => {
			const listener = listenOnPage();

			await open();
			pressKey(document.body, "t");

			expect(listener).not.toHaveBeenCalled();
		});

		it.each(["click", "contextmenu", "pointerdown", "touchstart"])(
			"hides %s of the viewer from the page",
			async (type) => {
				const listener = vi.fn();
				document.addEventListener(type, listener, {
					signal: pageController.signal,
				});

				await open();
				getHosts()[0]?.dispatchEvent(
					new Event(type, { bubbles: true, composed: true }),
				);

				expect(listener).not.toHaveBeenCalled();
			},
		);

		it("hides the events of the viewer from the page", async () => {
			const listener = listenOnPage();

			await open();
			const host = getHosts()[0];
			if (!host) throw new Error("No host");
			pressKey(host, "t");

			expect(listener).not.toHaveBeenCalled();
		});

		it("keeps the page from scrolling with the keys of the page", async () => {
			await open();

			expect(pressKey(document.body, "ArrowDown").defaultPrevented).toBe(true);
		});

		it("keeps the page from scrolling with the keys of the viewer", async () => {
			await open();
			const host = getHosts()[0];
			if (!host) throw new Error("No host");

			expect(pressKey(host, "ArrowDown").defaultPrevented).toBe(true);
		});

		it("replaces the previous viewer when opened again", async () => {
			await open([PHOTO]);
			await open([CLIP]);

			expect(getHosts()).toHaveLength(1);
			expect(mocks.onUnmount).toHaveBeenCalledOnce();
			expect(getViewerProps().candidates).toEqual([CLIP]);
			expect(viewerHost.isOpen).toBe(true);
		});

		// WXT fetches the styles for each UI and keeps each one until the context
		// of the script is invalidated.
		it("reuses the host when opened again", async () => {
			await open();
			const first = getHosts()[0];
			close();
			await open();

			expect(getHosts()[0]).toBe(first);
		});

		it("is open while the viewer is created", async () => {
			const opening = viewerHost.open([PHOTO]);

			expect(viewerHost.isOpen).toBe(true);

			await act(() => opening);
		});

		it("drops an open that a close replaced", async () => {
			const opening = viewerHost.open([PHOTO]);
			close();
			await act(() => opening);

			expect(viewerHost.isOpen).toBe(false);
			expect(getHosts()).toHaveLength(0);
			expect(mocks.MediaViewer).not.toHaveBeenCalled();
			expectPageUnlocked();
		});

		it("shows only the latest of two opens", async () => {
			const first = viewerHost.open([PHOTO]);
			const second = viewerHost.open([CLIP]);
			await act(() => Promise.all([first, second]));

			expect(getHosts()).toHaveLength(1);
			expect(mocks.MediaViewer).toHaveBeenCalledOnce();
			expect(getViewerProps().candidates).toEqual([CLIP]);
		});

		it("adds Inter from the files of the extension to the document", async () => {
			await open();

			expect([...fonts]).toEqual([
				{
					descriptors: { weight: "100 900" },
					family: FONT_FAMILY,
					source: `url(${fakeBrowser.runtime.getURL("/fonts/inter-variable.woff2")}) format("woff2")`,
				},
			]);
		});

		it("keeps one font when opened again", async () => {
			await open();
			await open();

			expect(fonts.size).toBe(1);
		});
	});

	describe("close", () => {
		it("removes the host", async () => {
			await open();
			close();

			expect(getHosts()).toHaveLength(0);
		});

		it("unlocks the page", async () => {
			await open();
			close();

			expectPageUnlocked();
		});

		it("removes the font from the document", async () => {
			await open();
			close();

			expect(fonts.size).toBe(0);
		});

		it("unmounts the React tree", async () => {
			await open();
			expect(mocks.onUnmount).not.toHaveBeenCalled();

			close();

			expect(mocks.onUnmount).toHaveBeenCalledOnce();
		});

		it("does nothing when nothing is open", () => {
			expect(() => close()).not.toThrow();
			expect(viewerHost.isOpen).toBe(false);
		});

		it("can be called twice", async () => {
			await open();
			close();

			expect(() => close()).not.toThrow();
			expect(mocks.onUnmount).toHaveBeenCalledOnce();
		});

		it("is called by the onClose callback of the viewer", async () => {
			await open();

			act(() => getViewerProps().onClose());

			expect(viewerHost.isOpen).toBe(false);
			expect(getHosts()).toHaveLength(0);
		});

		it("allows opening again", async () => {
			await open();
			close();
			await open();

			expect(viewerHost.isOpen).toBe(true);
			expect(getHosts()).toHaveLength(1);
		});
	});

	describe("errors", () => {
		it("logs and closes when the viewer throws while rendering", async () => {
			const error = new Error("render failed");
			mocks.MediaViewer.mockImplementation(() => {
				throw error;
			});

			// Inside act React rethrows the error to the test. Outside of it the
			// error is reported through onUncaughtError, like on a real page.
			Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", false);

			try {
				void viewerHost.open([PHOTO]);

				await vi.waitFor(() => expect(viewerHost.isOpen).toBe(false));
			} finally {
				Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
			}

			expect(consoleError).toHaveBeenCalledWith(error);
			expect(viewerHost.isOpen).toBe(false);
			expect(getHosts()).toHaveLength(0);
		});

		it("logs and closes when setting up the host throws", async () => {
			const error = new Error("font failed");
			vi.spyOn(fonts, "add").mockImplementationOnce(() => {
				throw error;
			});

			await expect(open()).resolves.toBeUndefined();

			expect(consoleError).toHaveBeenCalledWith(error);
			expect(viewerHost.isOpen).toBe(false);
			expect(getHosts()).toHaveLength(0);
			expectPageUnlocked();
		});

		it("can open again after a failure", async () => {
			vi.spyOn(fonts, "add").mockImplementationOnce(() => {
				throw new Error("font failed");
			});

			await open();
			await open();

			expect(viewerHost.isOpen).toBe(true);
			expect(getHosts()).toHaveLength(1);
		});
	});
});
