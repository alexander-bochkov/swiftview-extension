// First: WXT's storage and i18n read the global `browser` once, when they are
// imported.
import "./fake-browser";
import type { Preview } from "@storybook/react-vite";
import { storage } from "wxt/utils/storage";
import { i18n } from "#i18n";
import { ViewerFont } from "../src/entrypoints/top-frame.content/viewer-host/viewer-font";
import { withViewerFont } from "./decorators";

// Before the stories are imported, as some components use the extension APIs
// on import. Storybook doesn't auto-import `storage` and `i18n` as WXT does,
// so the components find them as globals.
Reflect.set(globalThis, "storage", storage);
Reflect.set(globalThis, "i18n", i18n);

// The font of the viewer, as the viewer host adds it to the page.
new ViewerFont().add();

export default {
	// Every component is shown inside the viewer host on a page.
	decorators: [withViewerFont],
} satisfies Preview;
