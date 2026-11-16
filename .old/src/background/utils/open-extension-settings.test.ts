import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { openExtensionSettings } from "./open-extension-settings";

const EXTENSION_ID = "abcdefghijklmnopabcdefghijklmnop";

const create = vi.fn(() => Promise.resolve({}));

beforeEach(() => {
	vi.stubGlobal("browser", {
		...browser,
		runtime: { id: EXTENSION_ID },
		tabs: { create },
	});
});

afterEach(() => {
	vi.clearAllMocks();
	vi.unstubAllGlobals();
});

describe("openExtensionSettings", () => {
	it("opens the page of the extension in a new tab", async () => {
		await openExtensionSettings();

		expect(create).toHaveBeenCalledExactlyOnceWith({
			url: `chrome://extensions/?id=${EXTENSION_ID}`,
		});
	});
});
