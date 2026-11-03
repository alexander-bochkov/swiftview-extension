import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { offerReload } from "./offer-reload";

type Injection = {
	readonly args: [string];
	readonly func: (message: string) => void;
};

const MESSAGE =
	"SwiftView can't open images on this page until it's reloaded. Reload now?";
const TAB_ID = 7;

const confirm = vi.fn(() => true);
const reload = vi.fn();

// Runs the injected function here, as Chrome would run it in the page.
const executeScript = vi.fn(({ args, func }: Injection) => {
	func(...args);

	return Promise.resolve();
});

beforeEach(() => {
	vi.stubGlobal("chrome", {
		...chrome,
		scripting: { executeScript },
	});
	vi.stubGlobal("confirm", confirm);
	vi.stubGlobal("location", { reload });
});

afterEach(() => {
	vi.clearAllMocks();
	vi.unstubAllGlobals();
});

describe("offerReload", () => {
	it("asks for confirmation in the tab without waiting for it to load", async () => {
		await offerReload(TAB_ID);

		expect(executeScript).toHaveBeenCalledExactlyOnceWith({
			args: [MESSAGE],
			func: expect.any(Function),
			injectImmediately: true,
			target: { tabId: TAB_ID },
		});
		expect(confirm).toHaveBeenCalledExactlyOnceWith(MESSAGE);
	});

	it("reloads the page if the user confirms", async () => {
		await offerReload(TAB_ID);

		expect(reload).toHaveBeenCalledOnce();
	});

	it("doesn't reload the page if the user declines", async () => {
		confirm.mockReturnValueOnce(false);

		await offerReload(TAB_ID);

		expect(reload).not.toHaveBeenCalled();
	});

	it("doesn't fail if the tab can't be reached", async () => {
		executeScript.mockRejectedValueOnce(new Error("No tab with id"));

		await expect(offerReload(TAB_ID)).resolves.toBeUndefined();
	});
});
