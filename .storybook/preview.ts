// First: WXT's storage reads the global `browser` once, when it is imported.
import "./fake-browser";
import type { Preview } from "@storybook/react-vite";
import { storage } from "wxt/utils/storage";
import { ViewerFont } from "../src/entrypoints/top-frame.content/viewer-host/viewer-font";
import { withViewerFont } from "./decorators";

// Before the stories are imported, as some components use the extension APIs
// on import. Storybook doesn't auto-import `storage` as WXT does, so the
// components find it as a global.
Reflect.set(globalThis, "storage", storage);

// The font of the viewer, as the viewer host adds it to the page.
new ViewerFont().add();

export default {
	// Every component is shown inside the viewer host on a page.
	decorators: [withViewerFont],
} satisfies Preview;
