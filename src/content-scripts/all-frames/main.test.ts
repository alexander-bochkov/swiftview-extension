import { MESSAGE_TYPE } from "@shared/constants";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MessageListener = (
	message: unknown,
	sender: unknown,
	sendResponse: (response: unknown) => void,
) => void;

const mocks = vi.hoisted(() => ({
	findBestImageUrl: vi.fn<() => string | null>(() => null),
	findMenuImage: vi.fn<() => HTMLImageElement | null>(() => null),
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

vi.mock("./find-menu-image", () => ({
	findMenuImage: mocks.findMenuImage,
}));

const BEST_URL = "https://example.com/photo-large.png";
const PHOTO_URL = "https://example.com/photo.png";
const POINT = { x: 10, y: 20 };

const MESSAGE = { srcUrl: PHOTO_URL, type: MESSAGE_TYPE.FIND_BEST_MEDIA_URL };

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
	it("finds the image of the menu with its point and url", () => {
		mocks.point = POINT;

		onMessage(MESSAGE, {}, sendResponse);

		expect(mocks.findMenuImage).toHaveBeenCalledExactlyOnceWith(
			POINT,
			PHOTO_URL,
		);
	});

	it("finds the image without a point before a menu opens", () => {
		onMessage(MESSAGE, {}, sendResponse);

		expect(mocks.findMenuImage).toHaveBeenCalledExactlyOnceWith(
			null,
			PHOTO_URL,
		);
	});

	it("finds the best url of the image of the menu", () => {
		const image = document.createElement("img");

		mocks.findMenuImage.mockReturnValueOnce(image);

		onMessage(MESSAGE, {}, sendResponse);

		expect(mocks.findBestImageUrl).toHaveBeenCalledExactlyOnceWith(image);
	});

	it("responds with the best url", () => {
		mocks.findMenuImage.mockReturnValueOnce(document.createElement("img"));
		mocks.findBestImageUrl.mockReturnValueOnce(BEST_URL);

		onMessage(MESSAGE, {}, sendResponse);

		expect(sendResponse).toHaveBeenCalledExactlyOnceWith(BEST_URL);
	});

	it("responds with null without a best url", () => {
		mocks.findMenuImage.mockReturnValueOnce(document.createElement("img"));

		onMessage(MESSAGE, {}, sendResponse);

		expect(sendResponse).toHaveBeenCalledExactlyOnceWith(null);
	});

	it("responds with null without the image of the menu", () => {
		onMessage(MESSAGE, {}, sendResponse);

		expect(mocks.findBestImageUrl).not.toHaveBeenCalled();
		expect(sendResponse).toHaveBeenCalledExactlyOnceWith(null);
	});

	it("ignores a message of another type", () => {
		onMessage(
			{ type: MESSAGE_TYPE.OPEN_MEDIA, url: PHOTO_URL },
			{},
			sendResponse,
		);

		expect(mocks.findMenuImage).not.toHaveBeenCalled();
		expect(sendResponse).not.toHaveBeenCalled();
	});
});
