export const offerReload = async (tabId: number): Promise<void> => {
	try {
		await browser.scripting.executeScript({
			args: [browser.i18n.getMessage("confirm_dialog@reload_page")],
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
