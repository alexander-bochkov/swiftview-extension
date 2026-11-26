import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { videoOptions } from "@/shared/storage";
import { Video } from "./video";

describe("Video", () => {
	beforeEach(() => {
		fakeBrowser.reset();
	});

	const renderOptions = async () => {
		render(<Video />);

		// Shown once the options load.
		return {
			autoplay: await screen.findByLabelText<HTMLInputElement>("Autoplay"),
			loop: screen.getByLabelText<HTMLInputElement>("Loop"),
			muted: screen.getByLabelText<HTMLInputElement>("Muted"),
		};
	};

	it("shows the options under the video heading", async () => {
		await renderOptions();

		expect(screen.getByRole("group", { name: "Video" })).toBeDefined();
	});

	it("leaves every option off by default", async () => {
		const { autoplay, loop, muted } = await renderOptions();

		expect([autoplay.checked, loop.checked, muted.checked]).toEqual([
			false,
			false,
			false,
		]);
	});

	it("shows the saved options", async () => {
		await videoOptions.setValue({ autoplay: true, loop: false, muted: true });

		const { autoplay, loop, muted } = await renderOptions();

		expect([autoplay.checked, loop.checked, muted.checked]).toEqual([
			true,
			false,
			true,
		]);
	});

	it("saves a changed option", async () => {
		const user = userEvent.setup();
		const { loop } = await renderOptions();

		await user.click(loop);

		await waitFor(async () =>
			expect(await videoOptions.getValue()).toEqual({
				autoplay: false,
				loop: true,
				muted: false,
			}),
		);
		expect(loop.checked).toBe(true);
	});

	it("keeps both of two quick changes", async () => {
		const { autoplay, loop } = await renderOptions();

		// Both before the first save is done.
		fireEvent.click(autoplay);
		fireEvent.click(loop);

		await waitFor(async () =>
			expect(await videoOptions.getValue()).toEqual({
				autoplay: true,
				loop: true,
				muted: false,
			}),
		);
		expect([autoplay.checked, loop.checked]).toEqual([true, true]);
	});

	it("follows the options saved elsewhere", async () => {
		const { muted } = await renderOptions();

		await videoOptions.setValue({ autoplay: false, loop: false, muted: true });

		await waitFor(() => expect(muted.checked).toBe(true));
	});

	it("logs an error when the options can't be loaded", async () => {
		const error = new Error("Storage unavailable.");
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		vi.spyOn(videoOptions, "getValue").mockRejectedValueOnce(error);

		render(<Video />);

		await waitFor(() => expect(consoleError).toHaveBeenCalledWith(error));
		expect(screen.queryByRole("checkbox")).toBeNull();
	});

	it("goes back to the saved options when a save fails", async () => {
		const error = new Error("Quota exceeded.");
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		vi.spyOn(videoOptions, "setValue").mockRejectedValueOnce(error);
		const user = userEvent.setup();
		const { autoplay } = await renderOptions();

		await user.click(autoplay);

		await waitFor(() => expect(autoplay.checked).toBe(false));
		expect(consoleError).toHaveBeenCalledWith(error);
		expect(await videoOptions.getValue()).toEqual({
			autoplay: false,
			loop: false,
			muted: false,
		});
	});
});
