import { MESSAGE_TYPE } from "@shared/constants";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestImageUrl } from "./request-image-url";

const BETTER_URL = "https://example.com/photo-large.png";
const FRAME_ID = 5;
const TAB_ID = 7;

const sendMessage = vi.fn<() => Promise<unknown>>(() =>
	Promise.resolve(BETTER_URL),
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

describe("requestImageUrl", () => {
	it("asks the frame of the menu", async () => {
		await requestImageUrl(TAB_ID, FRAME_ID);

		expect(sendMessage).toHaveBeenCalledExactlyOnceWith(
			TAB_ID,
			{ type: MESSAGE_TYPE.RESOLVE_IMAGE_URL },
			{ frameId: FRAME_ID },
		);
	});

	it("returns the url of the frame", async () => {
		expect(await requestImageUrl(TAB_ID, FRAME_ID)).toBe(BETTER_URL);
	});

	it("returns null when the frame has no better url", async () => {
		sendMessage.mockResolvedValueOnce(null);

		expect(await requestImageUrl(TAB_ID, FRAME_ID)).toBeNull();
	});

	it("returns null without a script in the frame", async () => {
		sendMessage.mockRejectedValueOnce(new Error("No receiving end"));

		expect(await requestImageUrl(TAB_ID, FRAME_ID)).toBeNull();
	});

	it("returns null on an unexpected response", async () => {
		sendMessage.mockResolvedValueOnce({ url: BETTER_URL });

		expect(await requestImageUrl(TAB_ID, FRAME_ID)).toBeNull();
	});
});
