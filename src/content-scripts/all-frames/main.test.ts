import { MEDIA_TYPE, MESSAGE_TYPE } from "@shared/constants";
import type { MediaCandidate } from "@shared/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MessageListener = (
	message: unknown,
	sender: unknown,
	sendResponse: (response: unknown) => void,
) => void;

const mocks = vi.hoisted(() => ({
	collectMediaCandidates: vi.fn<() => MediaCandidate[]>(() => []),
	findContextMenuMediaElement: vi.fn<
		() => HTMLImageElement | HTMLVideoElement | null
	>(() => null),
	init: vi.fn(),
	point: null as { x: number; y: number } | null,
}));

vi.mock("./collect-media-candidates", () => ({
	collectMediaCandidates: mocks.collectMediaCandidates,
}));

vi.mock("./context-menu-tracker", () => ({
	ContextMenuTracker: class {
		get point() {
			return mocks.point;
		}

		init = mocks.init;
	},
}));

vi.mock("./find-context-menu-media-element", () => ({
	findContextMenuMediaElement: mocks.findContextMenuMediaElement,
}));

const BEST_URL = "https://example.com/photo-large.png";
const PHOTO_URL = "https://example.com/photo.png";
const POINT = { x: 10, y: 20 };

const CANDIDATES = [
	{ type: MEDIA_TYPE.IMAGE, url: BEST_URL },
	{ type: MEDIA_TYPE.IMAGE, url: PHOTO_URL },
];

const MESSAGE = {
	srcUrl: PHOTO_URL,
	type: MESSAGE_TYPE.FIND_MEDIA_CANDIDATES,
};

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
	it("finds the media of the menu with its point and url", () => {
		mocks.point = POINT;

		onMessage(MESSAGE, {}, sendResponse);

		expect(mocks.findContextMenuMediaElement).toHaveBeenCalledExactlyOnceWith(
			POINT,
			PHOTO_URL,
		);
	});

	it("finds the media without a point before a menu opens", () => {
		onMessage(MESSAGE, {}, sendResponse);

		expect(mocks.findContextMenuMediaElement).toHaveBeenCalledExactlyOnceWith(
			null,
			PHOTO_URL,
		);
	});

	it("collects the candidates of the media of the menu", () => {
		const image = document.createElement("img");

		mocks.findContextMenuMediaElement.mockReturnValueOnce(image);

		onMessage(MESSAGE, {}, sendResponse);

		expect(mocks.collectMediaCandidates).toHaveBeenCalledExactlyOnceWith(
			image,
			PHOTO_URL,
		);
	});

	it("responds with the candidates", () => {
		mocks.findContextMenuMediaElement.mockReturnValueOnce(
			document.createElement("img"),
		);
		mocks.collectMediaCandidates.mockReturnValueOnce(CANDIDATES);

		onMessage(MESSAGE, {}, sendResponse);

		expect(sendResponse).toHaveBeenCalledExactlyOnceWith(CANDIDATES);
	});

	it("responds with null without the media of the menu", () => {
		onMessage(MESSAGE, {}, sendResponse);

		expect(mocks.collectMediaCandidates).not.toHaveBeenCalled();
		expect(sendResponse).toHaveBeenCalledExactlyOnceWith(null);
	});

	it("ignores a message of another type", () => {
		onMessage(
			{ candidates: CANDIDATES, type: MESSAGE_TYPE.OPEN_VIEWER },
			{},
			sendResponse,
		);

		expect(mocks.findContextMenuMediaElement).not.toHaveBeenCalled();
		expect(sendResponse).not.toHaveBeenCalled();
	});
});
