// @vitest-environment jsdom

import { injectCSS } from "virtual:css-injected-by-js";
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
import { PageLock } from "../page-lock";
import { ViewerHost } from "./viewer-host";

type ViewerProps = {
	readonly onClose: () => void;
	readonly url: string;
};

const mocks = vi.hoisted(() => ({
	injectCSS: vi.fn(),
	onUnmount: vi.fn(),
	Viewer: vi.fn(),
}));

// The stylesheet comes from a Vite virtual module that only exists in a build.
vi.mock("virtual:css-injected-by-js", () => ({ injectCSS: mocks.injectCSS }));
vi.mock("../viewer", () => ({ Viewer: mocks.Viewer }));

const PHOTO_URL = "https://example.com/photo.png";

// Reports the unmount through the cleanup of an effect.
const FakeViewer = (): null => {
	useEffect(() => mocks.onUnmount, []);

	return null;
};

describe("ViewerHost", () => {
	let consoleError: MockInstance<typeof console.error>;
	let pageLock: PageLock;
	let viewerHost: ViewerHost;

	const getHosts = () =>
		document.documentElement.querySelectorAll("swiftview-root");

	const getViewerProps = (): ViewerProps => {
		const props = mocks.Viewer.mock.lastCall?.[0];
		if (!props) throw new Error("Viewer was not rendered");

		return props;
	};

	// React renders inside act, so the render has finished when it returns.
	const open = (url = PHOTO_URL) => {
		act(() => viewerHost.open(url));
	};

	const close = () => {
		act(() => viewerHost.close());
	};

	beforeAll(() => {
		Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
	});

	beforeEach(() => {
		consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
		mocks.Viewer.mockImplementation(FakeViewer);

		pageLock = new PageLock();
		viewerHost = new ViewerHost(pageLock);
	});

	afterEach(() => {
		close();

		for (const host of getHosts()) host.remove();

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

		it("renders the viewer with the url", () => {
			open("https://example.com/other.png");

			expect(getViewerProps().url).toBe("https://example.com/other.png");
		});

		it("locks the page with the host", () => {
			const lock = vi.spyOn(pageLock, "lock");

			open();

			expect(lock).toHaveBeenCalledExactlyOnceWith(getHosts()[0]);
			expect(pageLock.isLocked).toBe(true);
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

			expect(pageLock.isLocked).toBe(false);
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
			mocks.Viewer.mockImplementation(() => {
				throw error;
			});

			// Inside act React rethrows the error to the test. Outside of it the
			// error is reported through onUncaughtError, like on a real page.
			Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", false);

			try {
				viewerHost.open(PHOTO_URL);

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
			expect(pageLock.isLocked).toBe(false);
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
