import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { MEDIA_TYPE, MESSAGE_TYPE } from "@/shared/constants";
import contentScript from "./index";

const mocks = vi.hoisted(() => ({
	init: vi.fn(),
	isOpen: false,
	open: vi.fn(),
}));

vi.mock("./viewer-host", () => ({
	ViewerHost: class {
		get isOpen(): boolean {
			return mocks.isOpen;
		}

		init = mocks.init;
		open = mocks.open;
	},
}));

const CLIP_URL = "https://example.com/clip.mp4";
const PHOTO_URL = "https://example.com/photo.png";

const CLIP = { type: MEDIA_TYPE.VIDEO, url: CLIP_URL };
const PHOTO = { type: MEDIA_TYPE.IMAGE, url: PHOTO_URL };

const openMessage = (...candidates: object[]) => ({
	candidates,
	type: MESSAGE_TYPE.OPEN_VIEWER,
});

const onMessage = (message: unknown) =>
	fakeBrowser.runtime.onMessage.trigger(message, {}, () => {});

// The script doesn't use its context.
const ctx = undefined as unknown as ContentScriptContext;

// The listener is registered again for every test, on a fresh fake browser.
beforeEach(() => {
	fakeBrowser.reset();
	contentScript.main(ctx);
});

afterEach(() => {
	mocks.isOpen = false;
	vi.clearAllMocks();
});

describe("on load", () => {
	it("initializes the viewer host", () => {
		expect(mocks.init).toHaveBeenCalledOnce();
	});
});

describe("on message", () => {
	it("opens the viewer with the candidates", () => {
		onMessage(openMessage(CLIP, PHOTO));

		expect(mocks.open).toHaveBeenCalledExactlyOnceWith([CLIP, PHOTO]);
	});

	// The viewer tells that it has nothing to show.
	it("opens the viewer even without candidates", () => {
		onMessage(openMessage());

		expect(mocks.open).toHaveBeenCalledExactlyOnceWith([]);
	});

	it("ignores the message while the viewer is open", () => {
		mocks.isOpen = true;

		onMessage(openMessage(PHOTO));

		expect(mocks.open).not.toHaveBeenCalled();
	});

	it("ignores a message of another type", () => {
		onMessage({ candidates: [PHOTO], type: "other" });

		expect(mocks.open).not.toHaveBeenCalled();
	});
});
