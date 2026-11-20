import { afterEach, describe, expect, it, vi } from "vitest";
import { openExtensionSettings } from "./open-extension-settings";

const create = vi.fn(() => Promise.resolve({}));

// A spy is typed by the last overload of an API, the one with a callback, so
// it calls a mock of the promise form, which the code uses.
vi.spyOn(fakeBrowser.tabs, "create").mockImplementation(create);

afterEach(() => {
	vi.clearAllMocks();
});

describe("openExtensionSettings", () => {
	it("opens the page of the extension in a new tab", async () => {
		await openExtensionSettings();

		expect(create).toHaveBeenCalledExactlyOnceWith({
			url: `chrome://extensions/?id=${fakeBrowser.runtime.id}`,
		});
	});
});
