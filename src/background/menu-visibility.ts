import { MENU_ITEM_ID } from "./constants";

let latestRefreshId = 0;

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

const refreshMenu = async (tabId: number): Promise<void> => {
	const refreshId = ++latestRefreshId;

	const visible = await canInjectContentScripts(tabId);

	// A newer refresh started while this one was running
	if (refreshId !== latestRefreshId) return;

	try {
		await chrome.contextMenus.update(MENU_ITEM_ID.OPEN_IMAGE, { visible });
	} catch {
		// The menu item hasn't yet been created by onInstalled
	}
};

export const refreshActiveTab = async (): Promise<void> => {
	const [tab] = await chrome.tabs.query({
		active: true,
		lastFocusedWindow: true,
	});

	if (tab?.id && tab.id !== chrome.tabs.TAB_ID_NONE) {
		await refreshMenu(tab.id);
	}
};
