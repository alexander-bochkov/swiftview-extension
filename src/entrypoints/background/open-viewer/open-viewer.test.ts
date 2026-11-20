import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MEDIA_TYPE } from "@/shared/constants";
import { openViewer } from "./open-viewer";

const mocks = vi.hoisted(() => ({
	sendMessage: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
}));

vi.mock("@/shared/messaging", () => ({ sendMessage: mocks.sendMessage }));

const PHOTO_URL = "https://example.com/photo.png";
const TAB_ID = 7;

const CANDIDATES = [{ type: MEDIA_TYPE.IMAGE, url: PHOTO_URL }];

beforeEach(() => {
	mocks.sendMessage.mockResolvedValue(undefined);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe("openViewer", () => {
	it("sends the candidates to the top frame", async () => {
		await openViewer(TAB_ID, CANDIDATES);

		expect(mocks.sendMessage).toHaveBeenCalledExactlyOnceWith(
			"OPEN_VIEWER",
			CANDIDATES,
			{ frameId: 0, tabId: TAB_ID },
		);
	});

	it("returns true once the top frame gets the message", async () => {
		expect(await openViewer(TAB_ID, CANDIDATES)).toBe(true);
	});

	it("returns false without a script in the top frame", async () => {
		mocks.sendMessage.mockRejectedValueOnce(new Error("No receiving end"));

		expect(await openViewer(TAB_ID, CANDIDATES)).toBe(false);
	});
});
