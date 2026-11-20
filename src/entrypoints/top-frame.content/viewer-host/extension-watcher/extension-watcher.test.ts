import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExtensionWatcher } from "./extension-watcher";

const CHECK_INTERVAL = 500;

// Restored after each test by hand: fakeBrowser.reset() doesn't put it back.
const EXTENSION_ID = fakeBrowser.runtime.id;

describe("ExtensionWatcher", () => {
	let extensionWatcher: ExtensionWatcher;
	let onLost: () => void;

	// Chrome takes the id of the extension from the script once it's gone.
	const removeExtension = () => {
		Reflect.set(fakeBrowser.runtime, "id", undefined);
	};

	beforeEach(() => {
		vi.useFakeTimers();
		extensionWatcher = new ExtensionWatcher();
		onLost = vi.fn();
	});

	afterEach(() => {
		extensionWatcher.stop();
		Reflect.set(fakeBrowser.runtime, "id", EXTENSION_ID);
		vi.useRealTimers();
	});

	it("calls back once the extension is gone", () => {
		extensionWatcher.watch(onLost);
		removeExtension();
		vi.advanceTimersByTime(CHECK_INTERVAL);

		expect(onLost).toHaveBeenCalledOnce();
	});

	it("doesn't call back while the extension is there", () => {
		extensionWatcher.watch(onLost);
		vi.advanceTimersByTime(CHECK_INTERVAL * 10);

		expect(onLost).not.toHaveBeenCalled();
	});

	it("calls back only once", () => {
		extensionWatcher.watch(onLost);
		removeExtension();
		vi.advanceTimersByTime(CHECK_INTERVAL * 10);

		expect(onLost).toHaveBeenCalledOnce();
	});

	it("doesn't call back after stop", () => {
		extensionWatcher.watch(onLost);
		extensionWatcher.stop();
		removeExtension();
		vi.advanceTimersByTime(CHECK_INTERVAL);

		expect(onLost).not.toHaveBeenCalled();
	});

	it("keeps the first callback while watching", () => {
		const other = vi.fn();

		extensionWatcher.watch(onLost);
		extensionWatcher.watch(other);
		removeExtension();
		vi.advanceTimersByTime(CHECK_INTERVAL);

		expect(onLost).toHaveBeenCalledOnce();
		expect(other).not.toHaveBeenCalled();
	});

	it("can watch again after stop", () => {
		extensionWatcher.watch(vi.fn());
		extensionWatcher.stop();

		extensionWatcher.watch(onLost);
		removeExtension();
		vi.advanceTimersByTime(CHECK_INTERVAL);

		expect(onLost).toHaveBeenCalledOnce();
	});
});
