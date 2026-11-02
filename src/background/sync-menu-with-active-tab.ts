import type { Nullable } from "@shared/types";
import { MENU_ITEM_ID } from "./constants";

let latestSyncId = 0;

// Chrome has no API to ask this directly, and documentUrlPatterns can't cover
// the Chrome Web Store, sites blocked by policy or the user's site access.
const canInjectContentScripts = async (tabId: number): Promise<boolean> => {
	try {
		await chrome.scripting.executeScript({
			func: () => {},
			injectImmediately: true,
			target: { tabId },
		});
		return true;
	} catch {
		return false;
	}
};

const updateMenuVisibility = async (tabId: number): Promise<void> => {
	const syncId = ++latestSyncId;

	const visible = await canInjectContentScripts(tabId);

	// A newer sync started while this one was running
	if (syncId !== latestSyncId) return;

	try {
		await chrome.contextMenus.update(MENU_ITEM_ID.OPEN_IMAGE, { visible });
	} catch {
		// The menu item hasn't yet been created by onInstalled
	}
};

const getActiveTabId = async (): Promise<Nullable<number>> => {
	const [tab] = await chrome.tabs.query({
		active: true,
		lastFocusedWindow: true,
	});

	return tab?.id && tab.id !== chrome.tabs.TAB_ID_NONE ? tab.id : null;
};

export const syncMenuWithActiveTab = async (): Promise<void> => {
	const tabId = await getActiveTabId();

	if (tabId) await updateMenuVisibility(tabId);
};
