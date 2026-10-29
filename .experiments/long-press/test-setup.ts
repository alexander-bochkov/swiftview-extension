import messages from "../../public/_locales/en/messages.json";

type Messages = Record<string, { message: string } | undefined>;

// The extension APIs only exist in a content script, and some modules use them
// on import. Set directly, not with vi.stubGlobal, so vi.unstubAllGlobals in a
// test doesn't remove it. Substitutions are ignored, as no message uses them.
Reflect.set(globalThis, "chrome", {
	i18n: {
		getMessage: (messageName: string) =>
			(messages as Messages)[messageName]?.message ?? "",
		getUILanguage: () => "en",
	},
});
