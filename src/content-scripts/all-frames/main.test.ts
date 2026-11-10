import { MESSAGE_TYPE } from "@shared/constants";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MessageListener = (
	message: unknown,
	sender: unknown,
	sendResponse: (response: unknown) => void,
) => void;

const mocks = vi.hoisted(() => ({
	findBestImageUrl: vi.fn<() => string | null>(() => null),
	init: vi.fn(),
	point: null as { x: number; y: number } | null,
}));

vi.mock("./context-menu-tracker", () => ({
	ContextMenuTracker: class {
		get point() {
			return mocks.point;
		}

		init = mocks.init;
	},
}));

vi.mock("./find-best-image-url", () => ({
	findBestImageUrl: mocks.findBestImageUrl,
}));

const BEST_URL = "https://example.com/photo-large.png";
const PHOTO_URL = "https://example.com/photo.png";
const POINT = { x: 10, y: 20 };

const sendResponse = vi.fn();

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
	mocks.point = null;
	vi.clearAllMocks();
	vi.unstubAllGlobals();
});

describe("on load", () => {
	it("initializes the context menu tracker", () => {
		expect(mocks.init).toHaveBeenCalledOnce();
	});
});

describe("on message", () => {
	it("finds the best url with the point of the menu", () => {
		mocks.point = POINT;

		onMessage({ type: MESSAGE_TYPE.FIND_BEST_MEDIA_URL }, {}, sendResponse);

		expect(mocks.findBestImageUrl).toHaveBeenCalledExactlyOnceWith(POINT);
	});

	it("finds the best url without a point before a menu opens", () => {
		onMessage({ type: MESSAGE_TYPE.FIND_BEST_MEDIA_URL }, {}, sendResponse);

		expect(mocks.findBestImageUrl).toHaveBeenCalledExactlyOnceWith(null);
	});

	it("responds with the best url", () => {
		mocks.findBestImageUrl.mockReturnValueOnce(BEST_URL);

		onMessage({ type: MESSAGE_TYPE.FIND_BEST_MEDIA_URL }, {}, sendResponse);

		expect(sendResponse).toHaveBeenCalledExactlyOnceWith(BEST_URL);
	});

	it("responds with null without a best url", () => {
		onMessage({ type: MESSAGE_TYPE.FIND_BEST_MEDIA_URL }, {}, sendResponse);

		expect(sendResponse).toHaveBeenCalledExactlyOnceWith(null);
	});

	it("ignores a message of another type", () => {
		onMessage(
			{ type: MESSAGE_TYPE.OPEN_MEDIA, url: PHOTO_URL },
			{},
			sendResponse,
		);

		expect(mocks.findBestImageUrl).not.toHaveBeenCalled();
		expect(sendResponse).not.toHaveBeenCalled();
	});
});
