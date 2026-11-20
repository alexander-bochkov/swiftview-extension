import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { MEDIA_TYPE } from "@/shared/constants";
import type { MediaCandidate } from "@/shared/types";
import contentScript from "./index";

const mocks = vi.hoisted(() => ({
	collectMediaCandidates: vi.fn<() => MediaCandidate[]>(() => []),
	findMediaElement: vi.fn<() => HTMLImageElement | HTMLVideoElement | null>(
		() => null,
	),
	init: vi.fn(),
	onMessage: vi.fn(),
	point: null as { x: number; y: number } | null,
}));

vi.mock("@/shared/messaging", () => ({ onMessage: mocks.onMessage }));

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

vi.mock("./find-media-element", () => ({
	findMediaElement: mocks.findMediaElement,
}));

const LARGE_URL = "https://example.com/photo-large.png";
const PHOTO_URL = "https://example.com/photo.png";
const POINT = { x: 10, y: 20 };

const CANDIDATES = [
	{ type: MEDIA_TYPE.IMAGE, url: LARGE_URL },
	{ type: MEDIA_TYPE.IMAGE, url: PHOTO_URL },
];

// Calls the listener the script registered, as the message would, and returns
// its answer.
const findMediaCandidates = () =>
	mocks.onMessage.mock.lastCall?.[1]({ data: PHOTO_URL });

// The script doesn't use its context.
const ctx = undefined as unknown as ContentScriptContext;

// The listener is registered again for every test.
beforeEach(() => {
	contentScript.main(ctx);
});

afterEach(() => {
	mocks.point = null;
	vi.clearAllMocks();
});

describe("on load", () => {
	it("initializes the context menu tracker", () => {
		expect(mocks.init).toHaveBeenCalledOnce();
	});

	it("listens for the message to find the candidates", () => {
		expect(mocks.onMessage).toHaveBeenCalledExactlyOnceWith(
			"FIND_MEDIA_CANDIDATES",
			expect.any(Function),
		);
	});
});

describe("on message", () => {
	it("finds the media of the menu with its point and url", () => {
		mocks.point = POINT;

		findMediaCandidates();

		expect(mocks.findMediaElement).toHaveBeenCalledExactlyOnceWith(
			document,
			POINT,
			PHOTO_URL,
		);
	});

	it("looks for no media without a point before a menu opens", () => {
		findMediaCandidates();

		expect(mocks.findMediaElement).not.toHaveBeenCalled();
	});

	it("collects the candidates of the media of the menu", () => {
		const image = document.createElement("img");

		mocks.point = POINT;
		mocks.findMediaElement.mockReturnValueOnce(image);

		findMediaCandidates();

		expect(mocks.collectMediaCandidates).toHaveBeenCalledExactlyOnceWith(
			image,
			PHOTO_URL,
		);
	});

	it("answers with the candidates", () => {
		mocks.point = POINT;
		mocks.findMediaElement.mockReturnValueOnce(document.createElement("img"));
		mocks.collectMediaCandidates.mockReturnValueOnce(CANDIDATES);

		expect(findMediaCandidates()).toBe(CANDIDATES);
	});

	it("answers null without the media of the menu", () => {
		expect(findMediaCandidates()).toBeNull();
		expect(mocks.collectMediaCandidates).not.toHaveBeenCalled();
	});
});
