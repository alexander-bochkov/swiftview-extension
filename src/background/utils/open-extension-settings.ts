export const openExtensionSettings = async (): Promise<void> => {
	await browser.tabs.create({
		url: `chrome://extensions/?id=${browser.runtime.id}`,
	});
};
