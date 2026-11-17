import { fakeBrowser } from "wxt/testing/fake-browser";
import messages from "../../../public/_locales/en/messages.json";

type Messages = Record<string, { message: string } | undefined>;

// The fake browser throws on the APIs it doesn't implement, and has no `dom`.
// Assigned, not spied on, so vi.restoreAllMocks in a test keeps them.
Object.assign(fakeBrowser.i18n, {
	// Substitutions are ignored, as no message uses them.
	getMessage: (messageName: string) =>
		(messages as Messages)[messageName]?.message ?? "",
	getUILanguage: () => "en",
});

Object.assign(fakeBrowser, {
	dom: {
		// Open roots only: jsdom keeps a closed root to itself.
		openOrClosedShadowRoot: (element: HTMLElement) => element.shadowRoot,
	},
});

export { fakeBrowser };
