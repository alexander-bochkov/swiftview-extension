import { MESSAGE_TYPE } from "@shared/constants";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MessageListener = (message: unknown) => void;

const mocks = vi.hoisted(() => ({
	isOpen: false,
	open: vi.fn(),
}));

vi.mock("./features", () => ({
	PageLock: class {},
	ScrollbarHider: class {},
	ViewerHost: class {
		get isOpen(): boolean {
			return mocks.isOpen;
		}

		open = mocks.open;
	},
}));

const PHOTO_URL = "https://example.com/photo.png";

let onMessage: MessageListener;

// The script registers its listener on import, so it's imported again for
// every test with a fresh stub.
beforeEach(async () => {
	vi.resetModules();

	vi.stubGlobal("chrome", {
		...chrome,
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

describe("on message", () => {
	it("opens the viewer with the image url", () => {
		onMessage({ type: MESSAGE_TYPE.OPEN_IMAGE, url: PHOTO_URL });

		expect(mocks.open).toHaveBeenCalledExactlyOnceWith(PHOTO_URL);
	});

	it("ignores the message while the viewer is open", () => {
		mocks.isOpen = true;

		onMessage({ type: MESSAGE_TYPE.OPEN_IMAGE, url: PHOTO_URL });

		expect(mocks.open).not.toHaveBeenCalled();
	});

	it("ignores a message of another type", () => {
		onMessage({ type: "other", url: PHOTO_URL });

		expect(mocks.open).not.toHaveBeenCalled();
	});
});
