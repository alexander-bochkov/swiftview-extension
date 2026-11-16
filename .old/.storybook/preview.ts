import type { Preview } from "@storybook/react-vite";
import { createFontFace } from "../src/content-scripts/top-frame/viewer-host/fonts";
import { fakeBrowser } from "../src/shared/test-utils";

// Before the stories are imported, as some components use the extension APIs
// on import.
Reflect.set(globalThis, "browser", fakeBrowser);

// The font of the viewer, as the viewer host adds it to the page.
document.fonts.add(createFontFace());

export default {} satisfies Preview;
