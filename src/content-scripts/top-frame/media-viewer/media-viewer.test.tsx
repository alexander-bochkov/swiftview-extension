import { MEDIA_TYPE } from "@shared/constants";
import type { MediaCandidate } from "@shared/types";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaViewer } from "./media-viewer";
import type { MediaProbe } from "./use-media-probe";

type ImageViewerProps = {
	readonly containerRef: { readonly current: HTMLElement | null };
	readonly image: HTMLImageElement;
	readonly onClose: () => void;
};

type VideoViewerProps = {
	readonly onClose: () => void;
	readonly video: HTMLVideoElement;
};

const mocks = vi.hoisted(() => ({
	ImageViewer: vi.fn<(props: ImageViewerProps) => string>(() => "image viewer"),
	useMediaProbe: vi.fn<() => MediaProbe>(() => ({ status: "loading" })),
	VideoViewer: vi.fn<(props: VideoViewerProps) => string>(() => "video viewer"),
}));

vi.mock("../image-viewer", () => ({ ImageViewer: mocks.ImageViewer }));
vi.mock("../video-viewer", () => ({ VideoViewer: mocks.VideoViewer }));
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

	const getImageViewerProps = (): ImageViewerProps => {
		const props = mocks.ImageViewer.mock.lastCall?.[0];
		if (!props) throw new Error("ImageViewer was not rendered");

		return props;
	};

	const getVideoViewerProps = (): VideoViewerProps => {
		const props = mocks.VideoViewer.mock.lastCall?.[0];
		if (!props) throw new Error("VideoViewer was not rendered");

		return props;
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

	describe("with an image", () => {
		const image = document.createElement("img");

		it("hands it to the image viewer in the overlay", () => {
			renderViewer({ element: image, status: "loaded" });

			expect(screen.getByText("image viewer")).toBeDefined();
			expect(getImageViewerProps()).toMatchObject({ image });
			expect(getImageViewerProps().containerRef.current).toBeInstanceOf(
				HTMLDialogElement,
			);
		});

		it("shows neither the loader nor its own close button", () => {
			renderViewer({ element: image, status: "loaded" });

			expect(screen.queryByText("spinner")).toBeNull();
			expect(screen.queryByRole("button")).toBeNull();
		});

		it("closes when the image viewer asks to", async () => {
			renderViewer({ element: image, status: "loaded" });

			act(() => getImageViewerProps().onClose());

			await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
		});
	});

	describe("with a video", () => {
		const video = document.createElement("video");

		it("hands it to the video viewer", () => {
			renderViewer({ element: video, status: "loaded" });

			expect(screen.getByText("video viewer")).toBeDefined();
			expect(getVideoViewerProps()).toMatchObject({ video });
		});

		it("shows neither the loader nor its own close button", () => {
			renderViewer({ element: video, status: "loaded" });

			expect(screen.queryByText("spinner")).toBeNull();
			expect(screen.queryByRole("button")).toBeNull();
		});

		it("closes when the video viewer asks to", async () => {
			renderViewer({ element: video, status: "loaded" });

			act(() => getVideoViewerProps().onClose());

			await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
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
