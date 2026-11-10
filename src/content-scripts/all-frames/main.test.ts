import { MESSAGE_TYPE } from "@shared/constants";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MessageListener = (
	message: unknown,
	sender: unknown,
	sendResponse: (response: unknown) => void,
) => void;

const mocks = vi.hoisted(() => ({
	init: vi.fn(),
	point: null as { x: number; y: number } | null,
	resolveImageUrl: vi.fn<() => string | null>(() => null),
}));

vi.mock("./context-menu-tracker", () => ({
	ContextMenuTracker: class {
		get point() {
			return mocks.point;
		}

		init = mocks.init;
	},
}));

vi.mock("./resolve-image-url", () => ({
	resolveImageUrl: mocks.resolveImageUrl,
}));

const BETTER_URL = "https://example.com/photo-large.png";
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
	it("resolves the url with the point of the menu", () => {
		mocks.point = POINT;

		onMessage({ type: MESSAGE_TYPE.RESOLVE_IMAGE_URL }, {}, sendResponse);

		expect(mocks.resolveImageUrl).toHaveBeenCalledExactlyOnceWith(POINT);
	});

	it("resolves the url without a point before a menu opens", () => {
		onMessage({ type: MESSAGE_TYPE.RESOLVE_IMAGE_URL }, {}, sendResponse);

		expect(mocks.resolveImageUrl).toHaveBeenCalledExactlyOnceWith(null);
	});

	it("responds with the resolved url", () => {
		mocks.resolveImageUrl.mockReturnValueOnce(BETTER_URL);

		onMessage({ type: MESSAGE_TYPE.RESOLVE_IMAGE_URL }, {}, sendResponse);

		expect(sendResponse).toHaveBeenCalledExactlyOnceWith(BETTER_URL);
	});

	it("responds with null without a better url", () => {
		onMessage({ type: MESSAGE_TYPE.RESOLVE_IMAGE_URL }, {}, sendResponse);

		expect(sendResponse).toHaveBeenCalledExactlyOnceWith(null);
	});

	it("ignores a message of another type", () => {
		onMessage(
			{ type: MESSAGE_TYPE.OPEN_IMAGE, url: PHOTO_URL },
			{},
			sendResponse,
		);

		expect(mocks.resolveImageUrl).not.toHaveBeenCalled();
		expect(sendResponse).not.toHaveBeenCalled();
	});
});
