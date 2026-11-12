import { MEDIA_TYPE, MESSAGE_TYPE } from "@shared/constants";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { openViewer } from "./open-viewer";

const PHOTO_URL = "https://example.com/photo.png";
const TAB_ID = 7;

const CANDIDATES = [{ type: MEDIA_TYPE.IMAGE, url: PHOTO_URL }];

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

describe("openViewer", () => {
	it("sends the candidates to the top frame", async () => {
		await openViewer(TAB_ID, CANDIDATES);

		expect(sendMessage).toHaveBeenCalledExactlyOnceWith(
			TAB_ID,
			{ candidates: CANDIDATES, type: MESSAGE_TYPE.OPEN_VIEWER },
			{ frameId: 0 },
		);
	});

	it("returns true once the top frame gets the message", async () => {
		expect(await openViewer(TAB_ID, CANDIDATES)).toBe(true);
	});

	it("returns false without a script in the top frame", async () => {
		sendMessage.mockRejectedValueOnce(new Error("No receiving end"));

		expect(await openViewer(TAB_ID, CANDIDATES)).toBe(false);
	});
});
