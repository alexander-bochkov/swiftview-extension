import { MESSAGE_TYPE } from "@shared/constants";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { openMedia } from "./open-media";

const PHOTO_URL = "https://example.com/photo.png";
const TAB_ID = 7;

const sendMessage = vi.fn<() => Promise<unknown>>(() => Promise.resolve());

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

describe("openMedia", () => {
	it("sends the url to the top frame", async () => {
		await openMedia(TAB_ID, PHOTO_URL);

		expect(sendMessage).toHaveBeenCalledExactlyOnceWith(
			TAB_ID,
			{ type: MESSAGE_TYPE.OPEN_MEDIA, url: PHOTO_URL },
			{ frameId: 0 },
		);
	});

	it("returns true once the top frame gets the message", async () => {
		expect(await openMedia(TAB_ID, PHOTO_URL)).toBe(true);
	});

	it("returns false without a script in the top frame", async () => {
		sendMessage.mockRejectedValueOnce(new Error("No receiving end"));

		expect(await openMedia(TAB_ID, PHOTO_URL)).toBe(false);
	});
});
