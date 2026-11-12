import { MEDIA_TYPE, MESSAGE_TYPE } from "@shared/constants";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MessageListener = (message: unknown) => void;

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

let onMessage: MessageListener;

// The script registers its listener on import, so it's imported again for
// every test with a fresh stub.
beforeEach(async () => {
	vi.resetModules();

	vi.stubGlobal("browser", {
		...browser,
		runtime: {
			onMessage: {
				addListener: (listener: MessageListener) => {
					onMessage = listener;
				},
			},
		},
	});

	await import("./main");
});

afterEach(() => {
	mocks.isOpen = false;
	vi.clearAllMocks();
	vi.unstubAllGlobals();
});

describe("on load", () => {
	it("initializes the viewer host", () => {
		expect(mocks.init).toHaveBeenCalledOnce();
	});
});

describe("on message", () => {
	it("opens the viewer with the image url", () => {
		onMessage(openMessage(PHOTO));

		expect(mocks.open).toHaveBeenCalledExactlyOnceWith(PHOTO_URL);
	});

	// The viewer shows only images so far.
	it("opens the viewer with the first image among the candidates", () => {
		onMessage(openMessage(CLIP, PHOTO));

		expect(mocks.open).toHaveBeenCalledExactlyOnceWith(PHOTO_URL);
	});

	it("opens the viewer with the first candidate without an image", () => {
		onMessage(openMessage(CLIP));

		expect(mocks.open).toHaveBeenCalledExactlyOnceWith(CLIP_URL);
	});

	it("ignores the message without candidates", () => {
		onMessage(openMessage());

		expect(mocks.open).not.toHaveBeenCalled();
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
