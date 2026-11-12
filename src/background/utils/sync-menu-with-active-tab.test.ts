import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { syncMenuWithActiveTab } from "./sync-menu-with-active-tab";

const MENU_ITEM_ID = "open-with-swiftview";
const TAB_ID = 7;

const ENABLED = { enabled: true, title: "Open with SwiftView" };
const DISABLED = {
	enabled: false,
	title: "SwiftView isn't available on this page",
};

const executeScript = vi.fn<() => Promise<unknown>>(() => Promise.resolve());
const query = vi.fn<() => Promise<Partial<chrome.tabs.Tab>[]>>(() =>
	Promise.resolve([{ id: TAB_ID }]),
);
const update = vi.fn(() => Promise.resolve());

beforeEach(() => {
	vi.stubGlobal("browser", {
		...browser,
		contextMenus: { update },
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
