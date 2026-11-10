import { MESSAGE_TYPE } from "@shared/constants";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { findBestMediaUrl } from "./find-best-media-url";

const BEST_URL = "https://example.com/photo-large.png";
const FRAME_ID = 5;
const TAB_ID = 7;

const sendMessage = vi.fn<() => Promise<unknown>>(() =>
	Promise.resolve(BEST_URL),
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

describe("findBestMediaUrl", () => {
	it("asks the frame of the menu", async () => {
		await findBestMediaUrl(TAB_ID, FRAME_ID);

		expect(sendMessage).toHaveBeenCalledExactlyOnceWith(
			TAB_ID,
			{ type: MESSAGE_TYPE.FIND_BEST_MEDIA_URL },
			{ frameId: FRAME_ID },
		);
	});

	it("returns the best url of the frame", async () => {
		expect(await findBestMediaUrl(TAB_ID, FRAME_ID)).toBe(BEST_URL);
	});

	it("returns null when the frame has no best url", async () => {
		sendMessage.mockResolvedValueOnce(null);

		expect(await findBestMediaUrl(TAB_ID, FRAME_ID)).toBeNull();
	});

	it("returns null without a script in the frame", async () => {
		sendMessage.mockRejectedValueOnce(new Error("No receiving end"));

		expect(await findBestMediaUrl(TAB_ID, FRAME_ID)).toBeNull();
	});

	it("returns null on an unexpected response", async () => {
		sendMessage.mockResolvedValueOnce({ url: BEST_URL });

		expect(await findBestMediaUrl(TAB_ID, FRAME_ID)).toBeNull();
	});
});
