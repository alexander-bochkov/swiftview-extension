// @vitest-environment jsdom

import { injectCSS } from "virtual:css-injected-by-js";
import { MEDIA_TYPE } from "@shared/constants";
import type { MediaCandidate } from "@shared/types";
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
import { FONT_FAMILY } from "./fonts";
import { ViewerHost } from "./viewer-host";

type ViewerProps = {
	readonly candidates: readonly MediaCandidate[];
	readonly onClose: () => void;
};

const mocks = vi.hoisted(() => ({
	injectCSS: vi.fn(),
	MediaViewer: vi.fn(),
	onUnmount: vi.fn(),
}));

// The stylesheet comes from a Vite virtual module that only exists in a build.
vi.mock("virtual:css-injected-by-js", () => ({ injectCSS: mocks.injectCSS }));
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
	const open = (candidates: readonly MediaCandidate[] = [PHOTO]) => {
		act(() => viewerHost.open(candidates));
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

	// The url of a file of the extension, as Chrome builds it.
	const getURL = (path: string) => `chrome-extension://swiftview/${path}`;

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
		// The extension APIs only exist in a content script.
		vi.stubGlobal("browser", { runtime: { getURL } });

		pageController = new AbortController();
		viewerHost = new ViewerHost();
	});

	afterEach(() => {
		act(() => viewerHost.destroy());
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

		it("is true after open", () => {
			open();

			expect(viewerHost.isOpen).toBe(true);
		});

		it("is false after close", () => {
			open();
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

		it("hides the keys from window listeners the page added after it", () => {
			viewerHost.init();
			const listener = listenOnWindow("keydown");

			open();
			pressKey(document.body, "t");

			expect(listener).not.toHaveBeenCalled();
		});

		it("hides the mouse buttons from window listeners the page added after it", () => {
			viewerHost.init();
			const listener = listenOnWindow("mousedown");

			open();
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
		it("closes the viewer", () => {
			open();
			act(() => viewerHost.destroy());

			expect(viewerHost.isOpen).toBe(false);
			expect(getHosts()).toHaveLength(0);
		});

		it("unlocks the page", () => {
			viewerHost.init();
			open();
			act(() => viewerHost.destroy());

			expectPageUnlocked();
		});
	});

	describe("open", () => {
		it("adds one host to the document element", () => {
			open();

			expect(getHosts()).toHaveLength(1);
			expect(getHosts()[0]?.parentElement).toBe(document.documentElement);
		});

		it("attaches a closed shadow root", () => {
			open();

			// A closed shadow root is not reachable through the host.
			expect(getHosts()[0]?.shadowRoot).toBeNull();
		});

		it("injects the styles into the shadow root", () => {
			open();

			expect(injectCSS).toHaveBeenCalledExactlyOnceWith({
				target: expect.any(ShadowRoot),
			});
		});

		it("renders the viewer with the candidates", () => {
			open([CLIP, PHOTO]);

			expect(getViewerProps().candidates).toEqual([CLIP, PHOTO]);
		});

		it("hides the events of the page from the page", () => {
			const listener = listenOnPage();

			open();
			pressKey(document.body, "t");

			expect(listener).not.toHaveBeenCalled();
		});

		it.each(["click", "contextmenu", "pointerdown", "touchstart"])(
			"hides %s of the viewer from the page",
			(type) => {
				const listener = vi.fn();
				document.addEventListener(type, listener, {
					signal: pageController.signal,
				});

				open();
				getHosts()[0]?.dispatchEvent(
					new Event(type, { bubbles: true, composed: true }),
				);

				expect(listener).not.toHaveBeenCalled();
			},
		);

		it("hides the events of the viewer from the page", () => {
			const listener = listenOnPage();

			open();
			const host = getHosts()[0];
			if (!host) throw new Error("No host");
			pressKey(host, "t");

			expect(listener).not.toHaveBeenCalled();
		});

		it("keeps the page from scrolling with the keys of the page", () => {
			open();

			expect(pressKey(document.body, "ArrowDown").defaultPrevented).toBe(true);
		});

		it("keeps the page from scrolling with the keys of the viewer", () => {
			open();
			const host = getHosts()[0];
			if (!host) throw new Error("No host");

			expect(pressKey(host, "ArrowDown").defaultPrevented).toBe(true);
		});

		it("replaces the previous viewer when opened again", () => {
			open();
			const first = getHosts()[0];

			open();

			expect(getHosts()).toHaveLength(1);
			expect(getHosts()[0]).not.toBe(first);
			expect(first?.isConnected).toBe(false);
			expect(viewerHost.isOpen).toBe(true);
		});

		it("adds Inter from the files of the extension to the document", () => {
			open();

			expect([...fonts]).toEqual([
				{
					descriptors: { weight: "100 900" },
					family: FONT_FAMILY,
					source: `url(${getURL("fonts/inter-variable.woff2")}) format("woff2")`,
				},
			]);
		});

		it("keeps one font when opened again", () => {
			open();
			open();

			expect(fonts.size).toBe(1);
		});
	});

	describe("close", () => {
		it("removes the host", () => {
			open();
			close();

			expect(getHosts()).toHaveLength(0);
		});

		it("unlocks the page", () => {
			open();
			close();

			expectPageUnlocked();
		});

		it("removes the font from the document", () => {
			open();
			close();

			expect(fonts.size).toBe(0);
		});

		it("unmounts the React tree", () => {
			open();
			expect(mocks.onUnmount).not.toHaveBeenCalled();

			close();

			expect(mocks.onUnmount).toHaveBeenCalledOnce();
		});

		it("does nothing when nothing is open", () => {
			expect(() => close()).not.toThrow();
			expect(viewerHost.isOpen).toBe(false);
		});

		it("can be called twice", () => {
			open();
			close();

			expect(() => close()).not.toThrow();
			expect(mocks.onUnmount).toHaveBeenCalledOnce();
		});

		it("is called by the onClose callback of the viewer", () => {
			open();

			act(() => getViewerProps().onClose());

			expect(viewerHost.isOpen).toBe(false);
			expect(getHosts()).toHaveLength(0);
		});

		it("allows opening again", () => {
			open();
			close();
			open();

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
				viewerHost.open([PHOTO]);

				await vi.waitFor(() => expect(viewerHost.isOpen).toBe(false));
			} finally {
				Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
			}

			expect(consoleError).toHaveBeenCalledWith(error);
			expect(viewerHost.isOpen).toBe(false);
			expect(getHosts()).toHaveLength(0);
		});

		it("logs and closes when setting up the host throws", () => {
			const error = new Error("styles failed");
			mocks.injectCSS.mockImplementationOnce(() => {
				throw error;
			});

			expect(() => open()).not.toThrow();

			expect(consoleError).toHaveBeenCalledWith(error);
			expect(viewerHost.isOpen).toBe(false);
			expect(getHosts()).toHaveLength(0);
			expectPageUnlocked();
		});

		it("can open again after a failure", () => {
			mocks.injectCSS.mockImplementationOnce(() => {
				throw new Error("styles failed");
			});

			open();
			open();

			expect(viewerHost.isOpen).toBe(true);
			expect(getHosts()).toHaveLength(1);
		});
	});
});
