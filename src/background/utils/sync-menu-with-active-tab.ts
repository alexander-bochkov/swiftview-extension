import { t } from "@shared/i18n";
import { MENU_ITEM_ID } from "../constants";
import { shouldAskForFileAccess } from "./should-ask-for-file-access";

let lastSyncId = 0;

// Chrome has no API to ask this directly, and documentUrlPatterns can't cover
// the Chrome Web Store, sites blocked by policy or the user's site access.
const canContentScriptsRunOnPage = async (tabId: number): Promise<boolean> => {
	try {
		await browser.scripting.executeScript({
			func: () => {},
			injectImmediately: true,
			target: { tabId },
		});
		return true;
	} catch {
		return false;
	}
};

const getMenuItemState = async (
	tabId: number,
	url?: string,
): Promise<{ enabled: boolean; title: string }> => {
	if (await shouldAskForFileAccess(url)) {
		return { enabled: true, title: t("context_menu@allow_file_access") };
	}

	const enabled = await canContentScriptsRunOnPage(tabId);

	return {
		enabled,
		title: t(
			enabled
				? "context_menu@open_with_swiftview"
				: "context_menu@not_available_on_page",
		),
	};
};

const updateMenuItem = async (tabId: number, url?: string): Promise<void> => {
	const syncId = ++lastSyncId;
	const state = await getMenuItemState(tabId, url);

	// A newer sync started while this one was running
	if (syncId !== lastSyncId) return;

	try {
		await browser.contextMenus.update(MENU_ITEM_ID, state);
	} catch {
		// The menu item hasn't yet been created by onInstalled
	}
};

export const syncMenuWithActiveTab = async (): Promise<void> => {
	const [tab] = await browser.tabs.query({
		active: true,
		lastFocusedWindow: true,
	});

	if (tab?.id) await updateMenuItem(tab.id, tab.url);
};
