import type { Preview } from "@storybook/react-vite";
import { ViewerFont } from "../src/entrypoints/top-frame.content/viewer-host/viewer-font";
import { fakeBrowser } from "../src/shared/test-utils";
import { withViewerFont } from "./decorators";

// The files of the extension are served from the root, as public/ is.
fakeBrowser.runtime.getURL = (path: string) => path;

// Before the stories are imported, as some components use the extension APIs
// on import. Storybook doesn't auto-import `browser` as WXT does, so the
// components find it as a global.
Reflect.set(globalThis, "browser", fakeBrowser);

// The font of the viewer, as the viewer host adds it to the page.
new ViewerFont().add();

export default {
	// Every component is shown inside the viewer host on a page.
	decorators: [withViewerFont],
} satisfies Preview;
