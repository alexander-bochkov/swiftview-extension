import { fakeBrowser } from "../src/shared/test-utils";

// The files of the extension are served from the root, as public/ is.
fakeBrowser.runtime.getURL = (path: string) => path;

// Storybook doesn't auto-import `browser` as WXT does, so the components find
// it as a global.
Reflect.set(globalThis, "browser", fakeBrowser);
