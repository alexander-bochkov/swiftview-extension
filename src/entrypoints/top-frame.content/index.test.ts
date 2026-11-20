import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { MEDIA_TYPE } from "@/shared/constants";
import contentScript from "./index";

const mocks = vi.hoisted(() => ({
	isOpen: false,
	onMessage: vi.fn(),
	open: vi.fn(),
}));

vi.mock("@/shared/messaging", () => ({ onMessage: mocks.onMessage }));

vi.mock("./viewer-host", () => ({
	ViewerHost: class {
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

// The script doesn't use its context.
const ctx = undefined as unknown as ContentScriptContext;

// The listener is registered again for every test.
beforeEach(() => {
	contentScript.main(ctx);
});

afterEach(() => {
	mocks.isOpen = false;
	vi.clearAllMocks();
});

describe("on load", () => {
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

	it("ignores the message while the viewer is open", () => {
		mocks.isOpen = true;

		openViewer(PHOTO);

		expect(mocks.open).not.toHaveBeenCalled();
	});
});
