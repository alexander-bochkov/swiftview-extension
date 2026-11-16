import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { syncMenuWithActiveTab } from "./sync-menu-with-active-tab";

const FILE_URL = "file:///C:/photos/index.html";
const MENU_ITEM_ID = "media";
const PAGE_URL = "https://example.com/photos";
const TAB_ID = 7;

const ENABLED = { enabled: true, title: "Open with SwiftView" };
const DISABLED = {
	enabled: false,
	title: "SwiftView isn't available on this page",
};
const ALLOW_FILE_ACCESS = {
	enabled: true,
	title: "Allow SwiftView access to file URLs",
};

const executeScript = vi.fn<() => Promise<unknown>>(() => Promise.resolve());
const isAllowedFileSchemeAccess = vi.fn(() => Promise.resolve(true));
const query = vi.fn<() => Promise<Partial<chrome.tabs.Tab>[]>>(() =>
	Promise.resolve([{ id: TAB_ID, url: PAGE_URL }]),
);
const update = vi.fn(() => Promise.resolve());

beforeEach(() => {
	vi.stubGlobal("browser", {
		...browser,
		contextMenus: { update },
		extension: { isAllowedFileSchemeAccess },
		scripting: { executeScript },
		tabs: { query },
	});
});

afterEach(() => {
	vi.clearAllMocks();
	vi.unstubAllGlobals();
});

describe("syncMenuWithActiveTab", () => {
	it("checks the active tab of the last focused window", async () => {
		await syncMenuWithActiveTab();

		expect(query).toHaveBeenCalledExactlyOnceWith({
			active: true,
			lastFocusedWindow: true,
		});
		expect(executeScript).toHaveBeenCalledExactlyOnceWith({
			func: expect.any(Function),
			injectImmediately: true,
			target: { tabId: TAB_ID },
		});
	});

	it("enables the menu item if content scripts can run on the page", async () => {
		await syncMenuWithActiveTab();

		expect(update).toHaveBeenCalledExactlyOnceWith(MENU_ITEM_ID, ENABLED);
	});

	it("disables the menu item and says so if content scripts can't run on the page", async () => {
		executeScript.mockRejectedValueOnce(new Error("Cannot access"));

		await syncMenuWithActiveTab();

		expect(update).toHaveBeenCalledExactlyOnceWith(MENU_ITEM_ID, DISABLED);
	});

	it("offers to allow the access on a local file the extension can't access", async () => {
		query.mockResolvedValueOnce([{ id: TAB_ID, url: FILE_URL }]);
		isAllowedFileSchemeAccess.mockResolvedValueOnce(false);

		await syncMenuWithActiveTab();

		expect(executeScript).not.toHaveBeenCalled();
		expect(update).toHaveBeenCalledExactlyOnceWith(
			MENU_ITEM_ID,
			ALLOW_FILE_ACCESS,
		);
	});

	it("enables the menu item on a local file the extension can access", async () => {
		query.mockResolvedValueOnce([{ id: TAB_ID, url: FILE_URL }]);

		await syncMenuWithActiveTab();

		expect(update).toHaveBeenCalledExactlyOnceWith(MENU_ITEM_ID, ENABLED);
	});

	it.each([
		["no active tab", []],
		["a tab without an id", [{}]],
	])("keeps the menu item as it is with %s", async (_, tabs) => {
		query.mockResolvedValueOnce(tabs);

		await syncMenuWithActiveTab();

		expect(executeScript).not.toHaveBeenCalled();
		expect(update).not.toHaveBeenCalled();
	});

	it("ignores the result of a sync that a newer one replaced", async () => {
		const staleCheck = Promise.withResolvers<void>();

		executeScript.mockReturnValueOnce(staleCheck.promise);

		const staleSync = syncMenuWithActiveTab();

		await syncMenuWithActiveTab();

		staleCheck.reject(new Error("Cannot access"));

		await staleSync;

		expect(update).toHaveBeenCalledExactlyOnceWith(MENU_ITEM_ID, ENABLED);
	});

	it("doesn't fail if the menu item isn't created yet", async () => {
		update.mockRejectedValueOnce(new Error("Cannot find menu item"));

		await expect(syncMenuWithActiveTab()).resolves.toBeUndefined();
	});
});
