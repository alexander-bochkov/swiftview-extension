import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { syncMenuWithActiveTab } from "./sync-menu-with-active-tab";

const OPEN_IMAGE_ID = "open-image";
const TAB_ID = 7;
const TAB_ID_NONE = -1;

const executeScript = vi.fn<() => Promise<unknown>>(() => Promise.resolve());
const query = vi.fn<() => Promise<Partial<chrome.tabs.Tab>[]>>(() =>
	Promise.resolve([{ id: TAB_ID }]),
);
const update = vi.fn(() => Promise.resolve());

beforeEach(() => {
	vi.stubGlobal("chrome", {
		...chrome,
		contextMenus: { update },
		scripting: { executeScript },
		tabs: { query, TAB_ID_NONE },
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

	it("shows the menu item if scripts can be injected into the tab", async () => {
		await syncMenuWithActiveTab();

		expect(update).toHaveBeenCalledExactlyOnceWith(OPEN_IMAGE_ID, {
			visible: true,
		});
	});

	it("hides the menu item if scripts can't be injected into the tab", async () => {
		executeScript.mockRejectedValueOnce(new Error("Cannot access"));

		await syncMenuWithActiveTab();

		expect(update).toHaveBeenCalledExactlyOnceWith(OPEN_IMAGE_ID, {
			visible: false,
		});
	});

	it.each([
		["no active tab", []],
		["a tab without an id", [{}]],
		["a tab that isn't a browser tab", [{ id: TAB_ID_NONE }]],
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

		expect(update).toHaveBeenCalledExactlyOnceWith(OPEN_IMAGE_ID, {
			visible: true,
		});
	});

	it("doesn't fail if the menu item isn't created yet", async () => {
		update.mockRejectedValueOnce(new Error("Cannot find menu item"));

		await expect(syncMenuWithActiveTab()).resolves.toBeUndefined();
	});
});
