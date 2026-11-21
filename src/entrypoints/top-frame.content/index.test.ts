import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { MEDIA_TYPE } from "@/shared/constants";
import contentScript from "./index";

const mocks = vi.hoisted(() => ({
	alert: vi.fn(),
	createViewerHost: vi.fn(),
	isOpen: false,
	MediaViewer: vi.fn(),
	onMessage: vi.fn(),
	open: vi.fn(),
}));

vi.mock("@/shared/messaging", () => ({ onMessage: mocks.onMessage }));

vi.mock("./media-viewer", () => ({ MediaViewer: mocks.MediaViewer }));

vi.mock("./viewer-host", () => ({
	ViewerHost: class {
		constructor(...args: unknown[]) {
			mocks.createViewerHost(...args);
		}

		get isOpen(): boolean {
			return mocks.isOpen;
		}

		open = mocks.open;
	},
}));

const CLIP_URL = "https://example.com/clip.mp4";
const PHOTO_URL = "https://example.com/photo.png";

const CLIP = { type: MEDIA_TYPE.VIDEO, url: CLIP_URL };
const PHOTO = { type: MEDIA_TYPE.IMAGE, url: PHOTO_URL };

// Calls the listener the script registered, as the message would.
const openViewer = (...candidates: object[]) =>
	mocks.onMessage.mock.lastCall?.[1]({ data: candidates });

// The script only passes its context on to the viewer host.
const ctx = {} as ContentScriptContext;

// The listener is registered again for every test.
beforeEach(() => {
	contentScript.main(ctx);
});

afterEach(() => {
	mocks.isOpen = false;
	vi.clearAllMocks();
});

describe("on load", () => {
	it("creates the viewer host with the context and the media viewer", () => {
		expect(mocks.createViewerHost).toHaveBeenCalledExactlyOnceWith(
			ctx,
			mocks.MediaViewer,
		);
	});

	it("listens for the message to open the viewer", () => {
		expect(mocks.onMessage).toHaveBeenCalledExactlyOnceWith(
			"OPEN_VIEWER",
			expect.any(Function),
		);
	});
});

describe("on message", () => {
	it("opens the viewer with the candidates", () => {
		openViewer(CLIP, PHOTO);

		expect(mocks.open).toHaveBeenCalledExactlyOnceWith([CLIP, PHOTO]);
	});

	// The viewer tells that it has nothing to show.
	it("opens the viewer even without candidates", () => {
		openViewer();

		expect(mocks.open).toHaveBeenCalledExactlyOnceWith([]);
	});

	describe("while the viewer is open", () => {
		beforeEach(() => {
			mocks.isOpen = true;
			vi.stubGlobal("alert", mocks.alert);
		});

		afterEach(() => {
			vi.unstubAllGlobals();
		});

		it("doesn't open the viewer again", () => {
			openViewer(PHOTO);

			expect(mocks.open).not.toHaveBeenCalled();
		});

		it("tells that the media is already open", () => {
			openViewer(PHOTO);

			expect(mocks.alert).toHaveBeenCalledExactlyOnceWith(
				"This image or video is already open in SwiftView.",
			);
		});
	});

	it("doesn't alert while the viewer is closed", () => {
		vi.stubGlobal("alert", mocks.alert);

		openViewer(PHOTO);

		expect(mocks.alert).not.toHaveBeenCalled();
		vi.unstubAllGlobals();
	});
});
