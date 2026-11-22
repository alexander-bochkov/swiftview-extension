import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { MEDIA_TYPE } from "@/shared/constants";
import { PHOTO, PHOTO_URL } from "@/shared/test-utils";
import type { MediaCandidate } from "@/shared/types";
import contentScript from "./index";

const mocks = vi.hoisted(() => ({
	collectMediaCandidates: vi.fn<() => MediaCandidate[]>(() => []),
	findMediaElement: vi.fn<
		() => HTMLImageElement | HTMLVideoElement | undefined
	>(() => undefined),
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
const POINT = { x: 10, y: 20 };

const CANDIDATES = [{ type: MEDIA_TYPE.IMAGE, url: LARGE_URL }, PHOTO];

// Calls the listener the script registered for the message, as the message
// would, and returns its answer.
const send = (type: string, data?: unknown) =>
	mocks.onMessage.mock.calls.find(([name]) => name === type)?.[1]({ data });

const findMediaCandidates = () => send("FIND_MEDIA_CANDIDATES", PHOTO_URL);

const pauseMedia = () => send("PAUSE_MEDIA");

// The script doesn't use its context.
const ctx = undefined as unknown as ContentScriptContext;

// The listener is registered again for every test.
beforeEach(() => {
	contentScript.main(ctx);
});

afterEach(() => {
	mocks.point = null;
});

describe("on load", () => {
	it("initializes the context menu tracker", () => {
		expect(mocks.init).toHaveBeenCalledOnce();
	});

	it("listens for the messages to find the candidates and pause the media", () => {
		expect(mocks.onMessage).toHaveBeenCalledTimes(2);
		expect(mocks.onMessage).toHaveBeenCalledWith(
			"FIND_MEDIA_CANDIDATES",
			expect.any(Function),
		);
		expect(mocks.onMessage).toHaveBeenCalledWith(
			"PAUSE_MEDIA",
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

describe("on pause", () => {
	const findVideo = () => {
		const video = document.createElement("video");
		const pause = vi.spyOn(video, "pause").mockImplementation(() => {});

		mocks.point = POINT;
		mocks.findMediaElement.mockReturnValueOnce(video);
		findMediaCandidates();

		return pause;
	};

	it("pauses the video of the menu", () => {
		const pause = findVideo();

		pauseMedia();

		expect(pause).toHaveBeenCalledOnce();
	});

	it("leaves an image of the menu", () => {
		mocks.point = POINT;
		mocks.findMediaElement.mockReturnValueOnce(document.createElement("img"));
		findMediaCandidates();

		expect(() => pauseMedia()).not.toThrow();
	});

	it("does nothing before a media is found", () => {
		expect(() => pauseMedia()).not.toThrow();
	});

	// The menu opened on another spot of the frame in the meantime.
	it("leaves the video of an earlier menu", () => {
		const pause = findVideo();
		findMediaCandidates();

		pauseMedia();

		expect(pause).not.toHaveBeenCalled();
	});
});
