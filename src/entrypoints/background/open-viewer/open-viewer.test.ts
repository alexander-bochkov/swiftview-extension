import { beforeEach, describe, expect, it, vi } from "vitest";
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
	mocks.sendMessage.mockResolvedValue(true);
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

	it("tells that the viewer opened", async () => {
		expect(await openViewer(TAB_ID, CANDIDATES)).toBe("opened");
	});

	it("tells that the viewer is already open", async () => {
		mocks.sendMessage.mockResolvedValueOnce(false);

		expect(await openViewer(TAB_ID, CANDIDATES)).toBe("already-open");
	});

	it("tells that there's no script in the top frame", async () => {
		mocks.sendMessage.mockRejectedValueOnce(new Error("No receiving end"));

		expect(await openViewer(TAB_ID, CANDIDATES)).toBe("unreachable");
	});
});
