import { MEDIA_TYPE } from "@shared/constants";
import { afterEach, describe, expect, it, vi } from "vitest";
import { collectMediaCandidates } from "./collect-media-candidates";

const mocks = vi.hoisted(() => ({
	findLinkedMedia: vi.fn<() => { type: string; url: string } | undefined>(
		() => undefined,
	),
	findSrcsetImages: vi.fn<() => { type: string; url: string }[]>(() => []),
}));

vi.mock("./find-srcset-images", () => ({
	findSrcsetImages: mocks.findSrcsetImages,
}));

vi.mock("./find-linked-media", () => ({
	findLinkedMedia: mocks.findLinkedMedia,
}));

const CLIP_URL = "https://example.com/clip.mp4";
const FULL_URL = "https://example.com/clip-full.mp4";
const LARGE_URL = "https://example.com/photo-large.png";
const LINK_URL = "https://example.com/photo-full.png";
const MEDIUM_URL = "https://example.com/photo-medium.png";
const PHOTO_URL = "https://example.com/photo.png";

const CLIP = { type: MEDIA_TYPE.VIDEO, url: CLIP_URL };
const FULL = { type: MEDIA_TYPE.VIDEO, url: FULL_URL };
const LARGE = { type: MEDIA_TYPE.IMAGE, url: LARGE_URL };
const LINK = { type: MEDIA_TYPE.IMAGE, url: LINK_URL };
const MEDIUM = { type: MEDIA_TYPE.IMAGE, url: MEDIUM_URL };
const PHOTO = { type: MEDIA_TYPE.IMAGE, url: PHOTO_URL };

const image = document.createElement("img");
const video = document.createElement("video");

afterEach(() => {
	vi.clearAllMocks();
});

describe("collectMediaCandidates", () => {
	describe("of an image", () => {
		it("lists the link, the srcset urls and the url of the menu, in that order", () => {
			mocks.findLinkedMedia.mockReturnValueOnce(LINK);
			mocks.findSrcsetImages.mockReturnValueOnce([LARGE, MEDIUM]);

			expect(collectMediaCandidates(image, PHOTO_URL)).toEqual([
				LINK,
				LARGE,
				MEDIUM,
				PHOTO,
			]);
		});

		it("looks for the link around the image", () => {
			collectMediaCandidates(image, PHOTO_URL);

			expect(mocks.findLinkedMedia).toHaveBeenCalledExactlyOnceWith(image);
		});

		it("looks for the srcset urls of the image", () => {
			collectMediaCandidates(image, PHOTO_URL);

			expect(mocks.findSrcsetImages).toHaveBeenCalledExactlyOnceWith(image);
		});

		it("lists a linked video before the image", () => {
			mocks.findLinkedMedia.mockReturnValueOnce(CLIP);

			expect(collectMediaCandidates(image, PHOTO_URL)).toEqual([CLIP, PHOTO]);
		});

		it("lists only the url of the menu without a link and srcset urls", () => {
			expect(collectMediaCandidates(image, PHOTO_URL)).toEqual([PHOTO]);
		});
	});

	describe("of a video", () => {
		it("lists the link and the url of the menu, in that order", () => {
			mocks.findLinkedMedia.mockReturnValueOnce(FULL);

			expect(collectMediaCandidates(video, CLIP_URL)).toEqual([FULL, CLIP]);
		});

		it("looks for the link around the video", () => {
			collectMediaCandidates(video, CLIP_URL);

			expect(mocks.findLinkedMedia).toHaveBeenCalledExactlyOnceWith(video);
		});

		it("doesn't look for srcset urls", () => {
			collectMediaCandidates(video, CLIP_URL);

			expect(mocks.findSrcsetImages).not.toHaveBeenCalled();
		});

		it("lists only the url of the menu without a link", () => {
			expect(collectMediaCandidates(video, CLIP_URL)).toEqual([CLIP]);
		});
	});

	describe("duplicates", () => {
		it("drops a link to the url of the menu", () => {
			mocks.findLinkedMedia.mockReturnValueOnce(PHOTO);

			expect(collectMediaCandidates(image, PHOTO_URL)).toEqual([PHOTO]);
		});

		it("drops a link to the url of the menu around a video", () => {
			mocks.findLinkedMedia.mockReturnValueOnce(CLIP);

			expect(collectMediaCandidates(video, CLIP_URL)).toEqual([CLIP]);
		});

		it("drops a srcset url that is the url of the menu", () => {
			mocks.findSrcsetImages.mockReturnValueOnce([LARGE, PHOTO]);

			expect(collectMediaCandidates(image, PHOTO_URL)).toEqual([LARGE, PHOTO]);
		});

		it("keeps the first of two candidates with one url", () => {
			mocks.findLinkedMedia.mockReturnValueOnce({
				type: MEDIA_TYPE.VIDEO,
				url: LARGE_URL,
			});
			mocks.findSrcsetImages.mockReturnValueOnce([LARGE]);

			expect(collectMediaCandidates(image, PHOTO_URL)).toEqual([
				{ type: MEDIA_TYPE.VIDEO, url: LARGE_URL },
				PHOTO,
			]);
		});
	});
});
