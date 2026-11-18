import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Nullable } from "@/shared/types";
import { EscapeKeyLock } from "./escape-key-lock";

describe("EscapeKeyLock", () => {
	const lock = vi.fn(() => Promise.resolve());
	const unlock = vi.fn();

	let escapeKeyLock: EscapeKeyLock;
	let fullscreenElement: Nullable<Element>;

	// jsdom implements neither the Keyboard Lock API nor the Fullscreen API.
	const setKeyboard = (keyboard: object | undefined) =>
		Object.defineProperty(navigator, "keyboard", {
			configurable: true,
			value: keyboard,
		});

	const setFullscreen = (element: Nullable<Element>) => {
		fullscreenElement = element;
		document.dispatchEvent(new Event("fullscreenchange"));
	};

	// A video of the page. One of the viewer in fullscreen is seen from the
	// document as the host.
	const pageVideo = document.createElement("video");
	const viewerHost = document.createElement("div");

	beforeEach(() => {
		fullscreenElement = null;
		Object.defineProperty(document, "fullscreenElement", {
			configurable: true,
			get: () => fullscreenElement,
		});
		setKeyboard({ lock, unlock });

		escapeKeyLock = new EscapeKeyLock();
	});

	afterEach(() => {
		escapeKeyLock.unlock();
		vi.resetAllMocks();
	});

	describe("lock", () => {
		it("locks Escape over an element of the page in fullscreen", () => {
			fullscreenElement = pageVideo;

			escapeKeyLock.lock();

			expect(lock).toHaveBeenCalledExactlyOnceWith(["Escape"]);
		});

		it("doesn't lock while nothing is in fullscreen", () => {
			escapeKeyLock.lock();

			expect(lock).not.toHaveBeenCalled();
		});

		it("locks Escape once an element of the page enters fullscreen", () => {
			escapeKeyLock.lock();

			setFullscreen(pageVideo);

			expect(lock).toHaveBeenCalledExactlyOnceWith(["Escape"]);
		});

		it("locks Escape once the video of the viewer enters fullscreen", () => {
			escapeKeyLock.lock();

			setFullscreen(viewerHost);

			expect(lock).toHaveBeenCalledExactlyOnceWith(["Escape"]);
		});

		// The video of the viewer in fullscreen above the page in fullscreen.
		it("keeps Escape locked from one element in fullscreen to another", () => {
			escapeKeyLock.lock();
			setFullscreen(pageVideo);

			setFullscreen(viewerHost);
			setFullscreen(pageVideo);

			expect(lock).toHaveBeenCalledOnce();
			expect(unlock).not.toHaveBeenCalled();
		});

		it("unlocks once the fullscreen ends", () => {
			escapeKeyLock.lock();
			setFullscreen(pageVideo);

			setFullscreen(null);

			expect(unlock).toHaveBeenCalledOnce();
		});

		it("locks once at most", () => {
			fullscreenElement = pageVideo;
			escapeKeyLock.lock();

			escapeKeyLock.lock();

			expect(lock).toHaveBeenCalledOnce();
		});

		it("does nothing without the Keyboard Lock API", () => {
			setKeyboard(undefined);
			fullscreenElement = pageVideo;

			expect(() => escapeKeyLock.lock()).not.toThrow();
		});
	});

	describe("unlock", () => {
		it("unlocks Escape", () => {
			fullscreenElement = pageVideo;
			escapeKeyLock.lock();

			escapeKeyLock.unlock();

			expect(unlock).toHaveBeenCalledOnce();
		});

		it("leaves a lock of the page alone when it locked nothing", () => {
			escapeKeyLock.lock();

			escapeKeyLock.unlock();

			expect(unlock).not.toHaveBeenCalled();
		});

		it("leaves a lock of the page alone when its lock was refused", async () => {
			lock.mockImplementation(() => Promise.reject(new Error("refused")));
			fullscreenElement = pageVideo;
			escapeKeyLock.lock();
			await Promise.resolve();

			escapeKeyLock.unlock();

			expect(unlock).not.toHaveBeenCalled();
		});

		it("stops following the fullscreen", () => {
			escapeKeyLock.lock();
			escapeKeyLock.unlock();

			setFullscreen(pageVideo);

			expect(lock).not.toHaveBeenCalled();
		});
	});
});
