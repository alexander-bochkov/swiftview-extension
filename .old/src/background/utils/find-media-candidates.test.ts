import { MEDIA_TYPE, MESSAGE_TYPE } from "@shared/constants";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { findMediaCandidates } from "./find-media-candidates";

const BEST_URL = "https://example.com/photo-large.png";
const FRAME_ID = 5;
const PHOTO_URL = "https://example.com/photo.png";
const TAB_ID = 7;

const BEST = { type: MEDIA_TYPE.IMAGE, url: BEST_URL };
const PHOTO = { type: MEDIA_TYPE.IMAGE, url: PHOTO_URL };

const sendMessage = vi.fn<() => Promise<unknown>>(() =>
	Promise.resolve([BEST, PHOTO]),
);

beforeEach(() => {
	vi.stubGlobal("browser", {
		...browser,
		tabs: { sendMessage },
	});
});

afterEach(() => {
	vi.clearAllMocks();
	vi.unstubAllGlobals();
});

describe("findMediaCandidates", () => {
	it("asks the frame of the menu with the url of the menu", async () => {
		await findMediaCandidates(TAB_ID, FRAME_ID, PHOTO);

		expect(sendMessage).toHaveBeenCalledExactlyOnceWith(
			TAB_ID,
			{ srcUrl: PHOTO_URL, type: MESSAGE_TYPE.FIND_MEDIA_CANDIDATES },
			{ frameId: FRAME_ID },
		);
	});

	it("returns the candidates of the frame", async () => {
		expect(await findMediaCandidates(TAB_ID, FRAME_ID, PHOTO)).toEqual([
			BEST,
			PHOTO,
		]);
	});

	it("returns the media of the menu when the frame has no candidates", async () => {
		sendMessage.mockResolvedValueOnce(null);

		expect(await findMediaCandidates(TAB_ID, FRAME_ID, PHOTO)).toEqual([PHOTO]);
	});

	it("returns the media of the menu without a script in the frame", async () => {
		sendMessage.mockRejectedValueOnce(new Error("No receiving end"));

		expect(await findMediaCandidates(TAB_ID, FRAME_ID, PHOTO)).toEqual([PHOTO]);
	});

	it.each([
		["a url", BEST_URL],
		["an empty list", []],
		["a list with a bad entry", [BEST, { url: PHOTO_URL }]],
		["a list with another type", [{ type: "audio", url: PHOTO_URL }]],
		["a list with a url that isn't a string", [{ type: "image", url: 1 }]],
		["a list with a null entry", [BEST, null]],
	])("returns the media of the menu on %s", async (_, response) => {
		sendMessage.mockResolvedValueOnce(response);

		expect(await findMediaCandidates(TAB_ID, FRAME_ID, PHOTO)).toEqual([PHOTO]);
	});
});
