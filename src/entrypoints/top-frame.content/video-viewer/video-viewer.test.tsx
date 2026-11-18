import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VideoViewer } from "./video-viewer";

// The buttons contain only an icon, so render its name to make them queryable.
vi.mock("../components/icon", async (importOriginal) => ({
	...(await importOriginal<typeof import("../components/icon")>()),
	Icon: ({ name }: { name: string }) => name,
}));

describe("VideoViewer", () => {
	const onClose = vi.fn();

	// Vitest globals are off, so Testing Library can't register this itself.
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	const renderViewer = (
		playVideo: (video: HTMLVideoElement) => Promise<void> = () =>
			Promise.resolve(),
	) => {
		const video = document.createElement("video");
		// jsdom doesn't focus a video, so the call is checked instead.
		const focus = vi.spyOn(video, "focus");
		// jsdom doesn't play a video either. Not a spy: a spy handles the promise
		// it returns, which would hide a rejection the viewer leaves unhandled.
		video.play = () => playVideo(video);

		render(<VideoViewer onClose={onClose} video={video} />);

		return { focus, video };
	};

	it("shows the video it is given", () => {
		const { video } = renderViewer();

		expect(document.body.contains(video)).toBe(true);
	});

	it("turns on the controls of the browser", () => {
		const { video } = renderViewer();

		expect(video.controls).toBe(true);
	});

	it("loops the video", () => {
		const { video } = renderViewer();

		expect(video.loop).toBe(true);
	});

	it("focuses the video for the keys of the controls", () => {
		const { focus } = renderViewer();

		expect(focus).toHaveBeenCalledOnce();
	});

	it("plays the video", () => {
		const playVideo = vi.fn(() => Promise.resolve());
		renderViewer(playVideo);

		expect(playVideo).toHaveBeenCalledOnce();
	});

	it("mutes the video before playing it, for the autoplay policy", () => {
		let mutedOnPlay: boolean | undefined;
		renderViewer((video) => {
			mutedOnPlay = video.muted;
			return Promise.resolve();
		});

		expect(mutedOnPlay).toBe(true);
	});

	// Vitest fails the run on an unhandled rejection, which is reported before
	// the next task runs.
	it("ignores a blocked play", async () => {
		renderViewer(() =>
			Promise.reject(new DOMException("Blocked", "NotAllowedError")),
		);

		await new Promise((resolve) => setTimeout(resolve));
	});

	it("shows only the close button", () => {
		renderViewer();

		expect(
			screen.getAllByRole("button").map((button) => button.textContent),
		).toEqual(["x-mark"]);
	});

	it("asks to close on the close button", async () => {
		const user = userEvent.setup();
		renderViewer();

		await user.click(screen.getByRole("button", { name: "x-mark" }));

		expect(onClose).toHaveBeenCalledOnce();
	});

	describe("Escape in fullscreen", () => {
		const exitFullscreen = vi.fn(() => Promise.resolve());
		const onPageKeyDown = vi.fn();

		// jsdom doesn't implement the Fullscreen API.
		const setFullscreen = (element: Element | null) =>
			Object.defineProperty(document, "fullscreenElement", {
				configurable: true,
				value: element,
			});

		beforeEach(() => {
			document.exitFullscreen = exitFullscreen;
			document.addEventListener("keydown", onPageKeyDown);
		});

		afterEach(() => {
			document.removeEventListener("keydown", onPageKeyDown);
			Reflect.deleteProperty(document, "fullscreenElement");
			exitFullscreen.mockReset();
		});

		it("exits the fullscreen of the video", () => {
			const { video } = renderViewer();
			setFullscreen(video);

			fireEvent.keyDown(video, { code: "Escape" });

			expect(exitFullscreen).toHaveBeenCalledOnce();
		});

		it("keeps the key from closing the viewer", () => {
			const { video } = renderViewer();
			setFullscreen(video);

			fireEvent.keyDown(video, { code: "Escape" });

			expect(onPageKeyDown).not.toHaveBeenCalled();
		});

		it("lets the key close the viewer out of fullscreen", () => {
			const { video } = renderViewer();
			setFullscreen(null);

			fireEvent.keyDown(video, { code: "Escape" });

			expect(exitFullscreen).not.toHaveBeenCalled();
			expect(onPageKeyDown).toHaveBeenCalledOnce();
		});

		it("lets the key close the viewer over another element in fullscreen", () => {
			const { video } = renderViewer();
			setFullscreen(document.createElement("video"));

			fireEvent.keyDown(video, { code: "Escape" });

			expect(exitFullscreen).not.toHaveBeenCalled();
			expect(onPageKeyDown).toHaveBeenCalledOnce();
		});

		it("ignores the other keys", () => {
			const { video } = renderViewer();
			setFullscreen(video);

			fireEvent.keyDown(video, { code: "Space" });

			expect(exitFullscreen).not.toHaveBeenCalled();
		});

		it("ignores a fullscreen that ended in the meantime", async () => {
			exitFullscreen.mockImplementation(() =>
				Promise.reject(new TypeError("Not in fullscreen")),
			);
			const { video } = renderViewer();
			setFullscreen(video);

			fireEvent.keyDown(video, { code: "Escape" });

			await new Promise((resolve) => setTimeout(resolve));
		});

		it("stops listening once unmounted", () => {
			const { video } = renderViewer();
			setFullscreen(video);
			cleanup();

			fireEvent.keyDown(video, { code: "Escape" });

			expect(exitFullscreen).not.toHaveBeenCalled();
		});
	});
});
