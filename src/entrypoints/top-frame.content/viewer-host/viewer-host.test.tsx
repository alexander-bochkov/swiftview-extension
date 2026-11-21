// @vitest-environment jsdom

import { act, createRef, useEffect } from "react";
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
import type { ViewerProps } from "../types";
import { ScrollbarHider } from "./scrollbar-hider";
import { ViewerHost } from "./viewer-host";

const mocks = vi.hoisted(() => ({
	onUnmount: vi.fn(),
	Viewer: vi.fn(),
}));

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
		const props = mocks.Viewer.mock.lastCall?.[0];
		if (!props) throw new Error("Viewer was not rendered");

		return props;
	};

	// React renders inside act, so the render has finished when it returns.
	const open = async (candidates: MediaCandidate[] = [PHOTO]) => {
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

	const turnWheel = (target: EventTarget): WheelEvent => {
		const e = new WheelEvent("wheel", {
			bubbles: true,
			cancelable: true,
			composed: true,
		});
		target.dispatchEvent(e);

		return e;
	};

	// Checks the page is back to normal: it sees its events and can scroll.
	// The isolation of the viewer ends after the event in progress, see
	// ViewerIsolator.release().
	const expectPageUnlocked = async () => {
		await act(() => new Promise((resolve) => setTimeout(resolve)));

		const listener = listenOnPage();
		const key = pressKey(document.body, "ArrowDown");

		expect(listener).toHaveBeenCalledOnce();
		expect(key.defaultPrevented).toBe(false);
		expect(turnWheel(document.body).defaultPrevented).toBe(false);
	};

	beforeAll(() => {
		Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
	});

	// jsdom doesn't implement fonts, so the fonts of the document are a plain
	// set of the created faces.
	let fonts: Set<FontFace>;

	beforeEach(() => {
		consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
		mocks.Viewer.mockImplementation(FakeViewer);

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
		viewerHost = new ViewerHost(ctx, mocks.Viewer);
	});

	afterEach(() => {
		act(() => viewerHost.close());
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

		it("keeps the page from scrolling with the keys of the viewer", async () => {
			await open();
			const host = getHosts()[0];
			if (!host) throw new Error("No host");

			expect(pressKey(host, "ArrowDown").defaultPrevented).toBe(true);
		});

		it("keeps the page from scrolling with the wheel over the viewer", async () => {
			await open();
			const host = getHosts()[0];
			if (!host) throw new Error("No host");

			expect(turnWheel(host).defaultPrevented).toBe(true);
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
			expect(mocks.Viewer).not.toHaveBeenCalled();
			await expectPageUnlocked();
		});

		it("shows only the latest of two opens", async () => {
			const first = viewerHost.open([PHOTO]);
			const second = viewerHost.open([CLIP]);
			await act(() => Promise.all([first, second]));

			expect(getHosts()).toHaveLength(1);
			expect(mocks.Viewer).toHaveBeenCalledOnce();
			expect(getViewerProps().candidates).toEqual([CLIP]);
		});

		it("adds the font to the document", async () => {
			await open();

			expect([...fonts].map(({ family }) => family)).toEqual([
				"SwiftView Inter",
			]);
		});

		it("shows the viewer in the font", async () => {
			const viewerRef = createRef<HTMLDivElement>();
			mocks.Viewer.mockImplementation(() => <div ref={viewerRef} />);
			// jsdom serializes the stack its own way, without the quotes.
			const expected = document.createElement("div");
			expected.style.fontFamily = '"SwiftView Inter", sans-serif';

			await open();

			// The viewer inherits it from the element it's rendered into.
			expect(viewerRef.current?.parentElement?.style.fontFamily).toBe(
				expected.style.fontFamily,
			);
		});

		it("keeps one font when opened again", async () => {
			await open();
			await open();

			expect(fonts.size).toBe(1);
		});

		// The failure itself is covered by ViewerFont.
		it("shows the viewer when the font can't be added", async () => {
			vi.spyOn(fonts, "add").mockImplementationOnce(() => {
				throw new Error("font failed");
			});

			await open();

			expect(viewerHost.isOpen).toBe(true);
			expect(getHosts()).toHaveLength(1);
			expect(mocks.Viewer).toHaveBeenCalledOnce();
		});
	});

	describe("fullscreen", () => {
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
			exitFullscreen.mockReset();
			exitFullscreen.mockImplementation(() => Promise.resolve());
		});

		it("exits the fullscreen of a page element", async () => {
			setFullscreen(document.createElement("video"));

			await open();

			expect(exitFullscreen).toHaveBeenCalledOnce();
			expect(viewerHost.isOpen).toBe(true);
		});

		it("shows the viewer once the fullscreen is left", async () => {
			let leave = () => {};
			exitFullscreen.mockImplementation(
				() =>
					new Promise<void>((resolve) => {
						leave = resolve;
					}),
			);
			setFullscreen(document.createElement("video"));

			const opening = viewerHost.open([PHOTO]);
			// Long enough for the UI, which waits for the styles.
			await act(() => new Promise((resolve) => setTimeout(resolve, 50)));

			expect(getHosts()).toHaveLength(0);

			leave();
			await act(() => opening);

			expect(getHosts()).toHaveLength(1);
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

			await expectPageUnlocked();
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

	describe("removed by the page", () => {
		// Mutation observers call back in a microtask, which act waits for.
		const removeFromPage = async (node: ChildNode) => {
			await act(async () => node.remove());
		};

		const getHost = () => {
			const host = getHosts()[0];
			if (!host) throw new Error("No host");

			return host;
		};

		it("closes the viewer when the page removes the host", async () => {
			await open();
			await removeFromPage(getHost());

			expect(viewerHost.isOpen).toBe(false);
			expect(mocks.onUnmount).toHaveBeenCalledOnce();
			expect(fonts.size).toBe(0);
		});

		it("unlocks the page when the page removes the host", async () => {
			await open();
			await removeFromPage(getHost());

			await expectPageUnlocked();
		});

		it("opens again after the page removed the host", async () => {
			await open();
			await removeFromPage(getHost());
			await open([CLIP]);

			expect(viewerHost.isOpen).toBe(true);
			expect(getHosts()).toHaveLength(1);
			expect(getViewerProps().candidates).toEqual([CLIP]);
		});

		it("keeps the viewer open when the page changes around the host", async () => {
			await open();
			const element = document.createElement("div");
			document.documentElement.append(element);
			await removeFromPage(element);

			expect(viewerHost.isOpen).toBe(true);
		});

		// The host is reused, see "reuses the host when opened again".
		it("closes a viewer opened again when the page removes the host", async () => {
			await open();
			close();
			await open();
			await removeFromPage(getHost());

			expect(viewerHost.isOpen).toBe(false);
			expect(mocks.onUnmount).toHaveBeenCalledTimes(2);
		});

		describe("with <html> replaced", () => {
			let pageRoot: HTMLElement;

			beforeEach(() => {
				pageRoot = document.documentElement;
			});

			afterEach(() => {
				if (document.documentElement !== pageRoot) {
					document.replaceChild(pageRoot, document.documentElement);
				}
			});

			const replaceRoot = async () => {
				await act(async () => {
					document.replaceChild(
						document.createElement("html"),
						document.documentElement,
					);
				});
			};

			it("closes the viewer", async () => {
				await open();
				await replaceRoot();

				expect(viewerHost.isOpen).toBe(false);
				expect(mocks.onUnmount).toHaveBeenCalledOnce();
			});

			it("opens again in the new <html>", async () => {
				await open();
				await replaceRoot();
				await open();

				expect(getHosts()).toHaveLength(1);
				expect(getHost().parentElement).toBe(document.documentElement);
			});
		});
	});

	describe("once the extension is gone", () => {
		// Restored after each test by hand: fakeBrowser.reset() doesn't put it
		// back.
		const extensionId = fakeBrowser.runtime.id;

		// Chrome takes the id of the extension from the script, and the observer
		// sees it on its next check.
		const removeExtension = () => {
			Reflect.set(fakeBrowser.runtime, "id", undefined);
			act(() => vi.advanceTimersByTime(1000));
		};

		// Only the interval of the observer: React and WXT keep their timers.
		beforeEach(() => {
			vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
		});

		afterEach(() => {
			Reflect.set(fakeBrowser.runtime, "id", extensionId);
			vi.useRealTimers();
		});

		describe("while the viewer is created", () => {
			it("doesn't show it once the context is invalidated", async () => {
				const opening = viewerHost.open([PHOTO]);
				ctx.abort();
				await act(() => opening);

				expect(getHosts()).toHaveLength(0);
				expect(mocks.Viewer).not.toHaveBeenCalled();
				await expectPageUnlocked();
			});

			// Before WXT notices, see ExtensionLossObserver.
			it("doesn't show it once the extension is gone", async () => {
				const opening = viewerHost.open([PHOTO]);
				Reflect.set(fakeBrowser.runtime, "id", undefined);
				await act(() => opening);

				expect(getHosts()).toHaveLength(0);
				expect(mocks.Viewer).not.toHaveBeenCalled();
			});
		});

		it("closes the viewer", async () => {
			await open();
			removeExtension();

			expect(viewerHost.isOpen).toBe(false);
			expect(getHosts()).toHaveLength(0);
			expect(mocks.onUnmount).toHaveBeenCalledOnce();
			expect(fonts.size).toBe(0);
		});

		it("unlocks the page", async () => {
			await open();
			removeExtension();

			await expectPageUnlocked();
		});

		it("keeps the viewer open while the extension is there", async () => {
			await open();
			act(() => vi.advanceTimersByTime(10_000));

			expect(viewerHost.isOpen).toBe(true);
		});

		it("stops watching once the viewer is closed", async () => {
			const abort = vi.spyOn(ctx, "abort");

			await open();
			close();
			removeExtension();

			expect(abort).not.toHaveBeenCalled();
		});
	});

	describe("errors", () => {
		it("logs and closes when the viewer throws while rendering", async () => {
			const error = new Error("render failed");
			mocks.Viewer.mockImplementation(() => {
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

		it("logs and closes when setting up the host throws", async () => {
			const error = new Error("setup failed");
			vi.spyOn(ScrollbarHider.prototype, "hide").mockImplementationOnce(() => {
				throw error;
			});

			await expect(open()).resolves.toBeUndefined();

			expect(consoleError).toHaveBeenCalledWith(error);
			expect(viewerHost.isOpen).toBe(false);
			expect(getHosts()).toHaveLength(0);
			await expectPageUnlocked();
		});

		it("can open again after a failure", async () => {
			vi.spyOn(ScrollbarHider.prototype, "hide").mockImplementationOnce(() => {
				throw new Error("setup failed");
			});

			await open();
			await open();

			expect(viewerHost.isOpen).toBe(true);
			expect(getHosts()).toHaveLength(1);
		});
	});
});
