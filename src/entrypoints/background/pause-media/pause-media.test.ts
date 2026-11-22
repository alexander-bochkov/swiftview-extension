import { describe, expect, it, vi } from "vitest";
import { pauseMedia } from "./pause-media";

const mocks = vi.hoisted(() => ({
	sendMessage: vi.fn<(...args: unknown[]) => Promise<unknown>>(() =>
		Promise.resolve(),
	),
}));

vi.mock("@/shared/messaging", () => ({ sendMessage: mocks.sendMessage }));

const FRAME_ID = 5;
const TAB_ID = 7;

describe("pauseMedia", () => {
	it("tells the frame of the menu to pause its media", async () => {
		await pauseMedia(TAB_ID, FRAME_ID);

		expect(mocks.sendMessage).toHaveBeenCalledExactlyOnceWith(
			"PAUSE_MEDIA",
			undefined,
			{ frameId: FRAME_ID, tabId: TAB_ID },
		);
	});

	it("resolves when the frame is gone", async () => {
		mocks.sendMessage.mockRejectedValueOnce(new Error("No receiving end"));

		await expect(pauseMedia(TAB_ID, FRAME_ID)).resolves.toBeUndefined();
	});
});
