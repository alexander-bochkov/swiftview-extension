import type messages from "../../../public/_locales/en/messages.json";

export const t = (
	messageName: keyof typeof messages,
	substitutions?: string | (string | number)[],
	options?: chrome.i18n.GetMessageOptions,
): string =>
	browser.i18n.getMessage(messageName, substitutions, options) || messageName;
