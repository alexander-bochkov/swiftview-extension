import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { shouldAskForFileAccess } from "./should-ask-for-file-access";

const FILE_URL = "file:///C:/photos/photo.png";
const PAGE_URL = "https://example.com/photos";

const isAllowedFileSchemeAccess = vi.fn(() => Promise.resolve(true));

beforeEach(() => {
	vi.stubGlobal("browser", {
		...browser,
		extension: { isAllowedFileSchemeAccess },
	});
});

afterEach(() => {
	vi.clearAllMocks();
	vi.unstubAllGlobals();
});

describe("shouldAskForFileAccess", () => {
	it("is true for a local file the extension can't access", async () => {
		isAllowedFileSchemeAccess.mockResolvedValueOnce(false);

		await expect(shouldAskForFileAccess(FILE_URL)).resolves.toBe(true);
	});

	it("is false for a local file the extension can access", async () => {
		await expect(shouldAskForFileAccess(FILE_URL)).resolves.toBe(false);
	});

	it.each([
		["a web page", PAGE_URL],
		["no url", undefined],
	])("is false for %s without asking", async (_, url) => {
		await expect(shouldAskForFileAccess(url)).resolves.toBe(false);
		expect(isAllowedFileSchemeAccess).not.toHaveBeenCalled();
	});
});
