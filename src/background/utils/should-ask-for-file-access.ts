export const shouldAskForFileAccess = async (url?: string): Promise<boolean> =>
	!!url?.startsWith("file:") &&
	!(await browser.extension.isAllowedFileSchemeAccess());
