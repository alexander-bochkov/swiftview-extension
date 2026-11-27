import { fakeBrowser } from "wxt/testing/fake-browser";
import locale from "../../locales/en.json";

type Locale = { readonly [key: string]: string | Locale };

// Named as in the built messages.json, where @wxt-dev/i18n joins the nested
// keys with "_", and i18n.t asks for them by that name.
const flatten = (messages: Locale, prefix = ""): [string, string][] =>
	Object.entries(messages).flatMap(([key, value]) =>
		typeof value === "string"
			? [[`${prefix}${key}`, value]]
			: flatten(value, `${prefix}${key}_`),
	);

const messages: ReadonlyMap<string, string> = new Map(flatten(locale));

// The fake browser throws on the APIs it doesn't implement, and has no `dom`.
// Assigned, not spied on, so vi.restoreAllMocks in a test keeps them.
Object.assign(fakeBrowser.i18n, {
	// Substitutions are ignored, as no message uses them.
	getMessage: (messageName: string) => messages.get(messageName) ?? "",
	getUILanguage: () => "en",
});

Object.assign(fakeBrowser, {
	dom: {
		// Open roots only: jsdom keeps a closed root to itself.
		openOrClosedShadowRoot: (el: HTMLElement) => el.shadowRoot,
	},
});

export { fakeBrowser };
