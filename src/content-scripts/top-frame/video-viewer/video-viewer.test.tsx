import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
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

	const renderViewer = () => {
		const video = document.createElement("video");
		// jsdom doesn't focus a video, so the call is checked instead.
		const focus = vi.spyOn(video, "focus");

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

	it("focuses the video for the keys of the controls", () => {
		const { focus } = renderViewer();

		expect(focus).toHaveBeenCalledOnce();
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
});
