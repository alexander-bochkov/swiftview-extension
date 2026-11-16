import type { Optional } from "@shared/types";
import messages from "../../../public/_locales/en/messages.json";

type Messages = Record<string, Optional<{ message: string }>>;

// The extension APIs only exist in a content script. A stand-in for the parts
// the content script uses, for the tests and Storybook. Substitutions are
// ignored, as no message uses them.
export const fakeBrowser = {
	dom: {
		// Open roots only: jsdom keeps a closed root to itself.
		openOrClosedShadowRoot: (element: HTMLElement) => element.shadowRoot,
	},
	i18n: {
		getMessage: (messageName: string) =>
			(messages as Messages)[messageName]?.message ?? messageName,
		getUILanguage: () => "en",
	},
	runtime: {
		// The files of the extension are served from the root, as public/ is.
		getURL: (path: string) => `/${path}`,
	},
};
