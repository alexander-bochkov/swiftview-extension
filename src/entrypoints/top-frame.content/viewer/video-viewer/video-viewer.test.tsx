import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { videoOptions } from "@/shared/storage";
import type { VideoOptions } from "@/shared/types";
import { VideoViewer } from "./video-viewer";

// The buttons contain only an icon, so render its name to make them queryable.
vi.mock("../components/icon", async (importOriginal) => ({
	...(await importOriginal<typeof import("../components/icon")>()),
	Icon: ({ name }: { name: string }) => name,
}));

describe("VideoViewer", () => {
	const onClose = vi.fn();

	beforeEach(() => {
		fakeBrowser.reset();
	});

	const renderViewer = () => {
		const video = document.createElement("video");
		// jsdom doesn't focus a video, so the call is checked instead.
		const focus = vi.spyOn(video, "focus");
		// jsdom doesn't play a video.
		const play = vi.spyOn(video, "play").mockResolvedValue();

		const { unmount } = render(<VideoViewer onClose={onClose} video={video} />);

		return { focus, play, unmount, video };
	};

	const saveOptions = (options: Partial<VideoOptions>) =>
		videoOptions.setValue({
			autoplay: false,
			loop: false,
			muted: false,
			...options,
		});

	it("shows the video it is given", () => {
		const { video } = renderViewer();

		expect(document.body.contains(video)).toBe(true);
	});

	it("turns on the controls of the browser", async () => {
		const { video } = renderViewer();

		await waitFor(() => expect(video.controls).toBe(true));
	});

	it("focuses the video for the keys of the controls", async () => {
		const { focus } = renderViewer();

		await waitFor(() => expect(focus).toHaveBeenCalledOnce());
	});

	it("opens the video paused, with sound and without loop by default", async () => {
		const { play, video } = renderViewer();

		await waitFor(() => expect(video.controls).toBe(true));
		expect(play).not.toHaveBeenCalled();
		expect(video.muted).toBe(false);
		expect(video.loop).toBe(false);
	});

	it("loops the video when the option is on", async () => {
		await saveOptions({ loop: true });

		const { video } = renderViewer();

		await waitFor(() => expect(video.loop).toBe(true));
	});

	it("mutes the video when the option is on", async () => {
		await saveOptions({ muted: true });

		const { video } = renderViewer();

		await waitFor(() => expect(video.muted).toBe(true));
	});

	it("plays the video when autoplay is on", async () => {
		await saveOptions({ autoplay: true });

		const { play } = renderViewer();

		await waitFor(() => expect(play).toHaveBeenCalledOnce());
	});

	// Chrome checks the autoplay policy when play is called, and always allows a
	// muted video.
	it("mutes the video before playing it", async () => {
		await saveOptions({ autoplay: true, muted: true });
		const { play, video } = renderViewer();
		let isMutedOnPlay: boolean | undefined;
		play.mockImplementation(async () => {
			isMutedOnPlay = video.muted;
		});

		await waitFor(() => expect(play).toHaveBeenCalledOnce());

		expect(isMutedOnPlay).toBe(true);
	});

	it("ignores a blocked play", async () => {
		await saveOptions({ autoplay: true });
		const { play } = renderViewer();
		play.mockRejectedValue(new DOMException("Blocked.", "NotAllowedError"));

		// An unhandled rejection would fail the run.
		await waitFor(() => expect(play).toHaveBeenCalledOnce());
	});

	it("leaves the video alone when closed before the options load", async () => {
		let resolveOptions = (_options: VideoOptions) => {};
		const options = new Promise<VideoOptions>((resolve) => {
			resolveOptions = resolve;
		});
		vi.spyOn(videoOptions, "getValue").mockReturnValueOnce(options);
		const { play, unmount, video } = renderViewer();

		unmount();
		resolveOptions({ autoplay: true, loop: true, muted: true });
		await options;

		expect(play).not.toHaveBeenCalled();
		expect(video.controls).toBe(false);
		expect(video.loop).toBe(false);
		expect(video.muted).toBe(false);
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

	// Chrome itself exits the fullscreen of the video with Escape, and doesn't
	// send the key then. Otherwise the key closes the viewer.
	it("lets Escape through to close the viewer", () => {
		const onPageKeyDown = vi.fn();
		document.addEventListener("keydown", onPageKeyDown);
		const { video } = renderViewer();

		fireEvent.keyDown(video, { code: "Escape" });
		document.removeEventListener("keydown", onPageKeyDown);

		expect(onPageKeyDown).toHaveBeenCalledOnce();
	});
});
