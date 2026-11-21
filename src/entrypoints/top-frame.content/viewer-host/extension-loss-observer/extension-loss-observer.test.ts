import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExtensionLossObserver } from "./extension-loss-observer";

const CHECK_INTERVAL = 500;

// Restored after each test by hand: fakeBrowser.reset() doesn't put it back.
const EXTENSION_ID = fakeBrowser.runtime.id;

describe("ExtensionLossObserver", () => {
	let extensionLossObserver: ExtensionLossObserver;
	let onLost: () => void;

	// Chrome takes the id of the extension from the script once it's gone.
	const removeExtension = () => {
		Reflect.set(fakeBrowser.runtime, "id", undefined);
	};

	beforeEach(() => {
		vi.useFakeTimers();
		extensionLossObserver = new ExtensionLossObserver();
		onLost = vi.fn();
	});

	afterEach(() => {
		extensionLossObserver.disconnect();
		Reflect.set(fakeBrowser.runtime, "id", EXTENSION_ID);
		vi.useRealTimers();
	});

	it("calls back once the extension is gone", () => {
		extensionLossObserver.observe(onLost);
		removeExtension();
		vi.advanceTimersByTime(CHECK_INTERVAL);

		expect(onLost).toHaveBeenCalledOnce();
	});

	it("doesn't call back while the extension is there", () => {
		extensionLossObserver.observe(onLost);
		vi.advanceTimersByTime(CHECK_INTERVAL * 10);

		expect(onLost).not.toHaveBeenCalled();
	});

	it("calls back only once", () => {
		extensionLossObserver.observe(onLost);
		removeExtension();
		vi.advanceTimersByTime(CHECK_INTERVAL * 10);

		expect(onLost).toHaveBeenCalledOnce();
	});

	it("doesn't call back after disconnect", () => {
		extensionLossObserver.observe(onLost);
		extensionLossObserver.disconnect();
		removeExtension();
		vi.advanceTimersByTime(CHECK_INTERVAL);

		expect(onLost).not.toHaveBeenCalled();
	});

	it("keeps the first callback while observing", () => {
		const other = vi.fn();

		extensionLossObserver.observe(onLost);
		extensionLossObserver.observe(other);
		removeExtension();
		vi.advanceTimersByTime(CHECK_INTERVAL);

		expect(onLost).toHaveBeenCalledOnce();
		expect(other).not.toHaveBeenCalled();
	});

	it("can watch again after disconnect", () => {
		extensionLossObserver.observe(vi.fn());
		extensionLossObserver.disconnect();

		extensionLossObserver.observe(onLost);
		removeExtension();
		vi.advanceTimersByTime(CHECK_INTERVAL);

		expect(onLost).toHaveBeenCalledOnce();
	});
});
