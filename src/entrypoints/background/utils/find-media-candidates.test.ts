import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MEDIA_TYPE } from "@/shared/constants";
import { findMediaCandidates } from "./find-media-candidates";

const mocks = vi.hoisted(() => ({
	sendMessage: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
}));

vi.mock("@/shared/messaging", () => ({ sendMessage: mocks.sendMessage }));

const BEST_URL = "https://example.com/photo-large.png";
const FRAME_ID = 5;
const PHOTO_URL = "https://example.com/photo.png";
const TAB_ID = 7;

const BEST = { type: MEDIA_TYPE.IMAGE, url: BEST_URL };
const PHOTO = { type: MEDIA_TYPE.IMAGE, url: PHOTO_URL };

beforeEach(() => {
	mocks.sendMessage.mockResolvedValue([BEST, PHOTO]);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe("findMediaCandidates", () => {
	it("asks the frame of the menu with the url of the menu", async () => {
		await findMediaCandidates(TAB_ID, FRAME_ID, PHOTO);

		expect(mocks.sendMessage).toHaveBeenCalledExactlyOnceWith(
			"FIND_MEDIA_CANDIDATES",
			PHOTO_URL,
			{ frameId: FRAME_ID, tabId: TAB_ID },
		);
	});

	it("returns the candidates of the frame", async () => {
		expect(await findMediaCandidates(TAB_ID, FRAME_ID, PHOTO)).toEqual([
			BEST,
			PHOTO,
		]);
	});

	it("returns the media of the menu when the frame has no candidates", async () => {
		mocks.sendMessage.mockResolvedValueOnce(null);

		expect(await findMediaCandidates(TAB_ID, FRAME_ID, PHOTO)).toEqual([PHOTO]);
	});

	it("returns the media of the menu without a script in the frame", async () => {
		mocks.sendMessage.mockRejectedValueOnce(new Error("No receiving end"));

		expect(await findMediaCandidates(TAB_ID, FRAME_ID, PHOTO)).toEqual([PHOTO]);
	});
});
