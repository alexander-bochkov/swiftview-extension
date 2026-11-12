import { MEDIA_TYPE } from "@shared/constants";
import type { MediaCandidate } from "@shared/types";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaViewer } from "./media-viewer";
import type { MediaProbe } from "./use-media-probe";

const mocks = vi.hoisted(() => ({
	useMediaProbe: vi.fn<() => MediaProbe>(() => ({ status: "loading" })),
}));

vi.mock("./use-media-probe", () => ({ useMediaProbe: mocks.useMediaProbe }));

// The buttons contain only an icon, so render its name to make them queryable.
vi.mock("../components/icon", async (importOriginal) => ({
	...(await importOriginal<typeof import("../components/icon")>()),
	Icon: ({ name }: { name: string }) => name,
}));

const CLIP: MediaCandidate = {
	type: MEDIA_TYPE.VIDEO,
	url: "https://example.com/clip.mp4",
};
const PHOTO: MediaCandidate = {
	type: MEDIA_TYPE.IMAGE,
	url: "https://example.com/photo.png",
};

describe("MediaViewer", () => {
	const onClose = vi.fn();

	beforeEach(() => {
		// jsdom doesn't implement the modal dialog and animations.
		HTMLDialogElement.prototype.showModal = function () {
			this.open = true;
		};
		HTMLDialogElement.prototype.close = function () {
			this.open = false;
		};
		HTMLDialogElement.prototype.getAnimations = () => [];
	});

	// Vitest globals are off, so Testing Library can't register this itself.
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	const renderViewer = (
		probe: MediaProbe,
		candidates: readonly MediaCandidate[] = [PHOTO],
	) => {
		mocks.useMediaProbe.mockReturnValue(probe);

		return render(<MediaViewer candidates={candidates} onClose={onClose} />);
	};

	const getButtonNames = () =>
		screen.getAllByRole("button").map((button) => button.textContent);

	it("probes the candidates", () => {
		renderViewer({ status: "loading" }, [CLIP, PHOTO]);

		expect(mocks.useMediaProbe).toHaveBeenCalledWith([CLIP, PHOTO]);
	});

	it("shows only the close button", () => {
		renderViewer({ status: "loading" });

		expect(getButtonNames()).toEqual(["x-mark"]);
	});

	it("closes on the close button", async () => {
		const user = userEvent.setup();
		renderViewer({ status: "loading" });

		await user.click(screen.getByRole("button", { name: "x-mark" }));

		await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
	});

	describe("while probing", () => {
		it("shows the loader", () => {
			renderViewer({ status: "loading" });

			expect(screen.getByText("spinner")).toBeDefined();
		});
	});

	describe("with the media", () => {
		it("shows the image", () => {
			const image = document.createElement("img");

			const { container } = renderViewer({ element: image, status: "loaded" });

			expect(container.contains(image)).toBe(true);
		});

		it("shows the video with the native controls", () => {
			const video = document.createElement("video");

			const { container } = renderViewer({ element: video, status: "loaded" });

			expect(container.contains(video)).toBe(true);
			expect(video.controls).toBe(true);
		});

		it("hides the loader", () => {
			renderViewer({
				element: document.createElement("img"),
				status: "loaded",
			});

			expect(screen.queryByText("spinner")).toBeNull();
		});
	});

	describe("when nothing loaded", () => {
		it("tells that the media couldn't be opened", () => {
			renderViewer({ status: "failed" });

			expect(
				screen.getByText("Couldn't open the image or video"),
			).toBeDefined();
		});

		it("hides the loader", () => {
			renderViewer({ status: "failed" });

			expect(screen.queryByText("spinner")).toBeNull();
		});
	});
});
