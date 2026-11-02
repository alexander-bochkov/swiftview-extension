import { t } from "@shared/i18n";

export const offerReload = async (tabId: number): Promise<void> => {
	try {
		await chrome.scripting.executeScript({
			args: [t("confirm_dialog@reload_page")],
			func: (message: string) => {
				if (confirm(message)) location.reload();
			},
			injectImmediately: true,
			target: { tabId },
		});
	} catch {
		// The tab was closed or navigated away in the meantime
	}
};
