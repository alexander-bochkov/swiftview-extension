import { fakeBrowser } from "@shared/test-utils";

// Some modules use the extension APIs on import. Set directly, not with
// vi.stubGlobal, so vi.unstubAllGlobals in a test doesn't remove it.
Reflect.set(globalThis, "browser", fakeBrowser);
