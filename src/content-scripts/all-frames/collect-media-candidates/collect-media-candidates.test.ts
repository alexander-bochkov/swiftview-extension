import { MEDIA_TYPE } from "@shared/constants";
import { afterEach, describe, expect, it, vi } from "vitest";
import { collectMediaCandidates } from "./collect-media-candidates";

const mocks = vi.hoisted(() => ({
	findBestImage: vi.fn<() => { type: string; url: string } | null>(() => null),
	findLinkedMedia: vi.fn<() => { type: string; url: string } | null>(
		() => null,
	),
}));

vi.mock("./find-best-image", () => ({
	findBestImage: mocks.findBestImage,
}));

vi.mock("./find-linked-media", () => ({
	findLinkedMedia: mocks.findLinkedMedia,
}));

const BEST_URL = "https://example.com/photo-large.png";
const CLIP_URL = "https://example.com/clip.mp4";
const LINK_URL = "https://example.com/photo-full.png";
const PHOTO_URL = "https://example.com/photo.png";

const BEST = { type: MEDIA_TYPE.IMAGE, url: BEST_URL };
const CLIP = { type: MEDIA_TYPE.VIDEO, url: CLIP_URL };
const LINK = { type: MEDIA_TYPE.IMAGE, url: LINK_URL };
const PHOTO = { type: MEDIA_TYPE.IMAGE, url: PHOTO_URL };

const image = document.createElement("img");
const video = document.createElement("video");

afterEach(() => {
	vi.clearAllMocks();
});

describe("collectMediaCandidates", () => {
	describe("of an image", () => {
		it("lists the link, the best url and the url of the menu, in that order", () => {
			mocks.findLinkedMedia.mockReturnValueOnce(LINK);
			mocks.findBestImage.mockReturnValueOnce(BEST);

			expect(collectMediaCandidates(image, PHOTO_URL)).toEqual([
				LINK,
				BEST,
				PHOTO,
			]);
		});

		it("looks for the link around the image", () => {
			collectMediaCandidates(image, PHOTO_URL);

			expect(mocks.findLinkedMedia).toHaveBeenCalledExactlyOnceWith(image);
		});

		it("looks for the best url of the image", () => {
			collectMediaCandidates(image, PHOTO_URL);

			expect(mocks.findBestImage).toHaveBeenCalledExactlyOnceWith(image);
		});

		it("lists a linked video before the image", () => {
			mocks.findLinkedMedia.mockReturnValueOnce(CLIP);

			expect(collectMediaCandidates(image, PHOTO_URL)).toEqual([CLIP, PHOTO]);
		});

		it("lists only the url of the menu without a link and a best url", () => {
			expect(collectMediaCandidates(image, PHOTO_URL)).toEqual([PHOTO]);
		});
	});

	describe("of a video", () => {
		it("lists only the url of the menu", () => {
			expect(collectMediaCandidates(video, CLIP_URL)).toEqual([CLIP]);
		});

		it("doesn't look for a link or a best url", () => {
			collectMediaCandidates(video, CLIP_URL);

			expect(mocks.findLinkedMedia).not.toHaveBeenCalled();
			expect(mocks.findBestImage).not.toHaveBeenCalled();
		});
	});

	describe("duplicates", () => {
		it("drops a link to the url of the menu", () => {
			mocks.findLinkedMedia.mockReturnValueOnce(PHOTO);

			expect(collectMediaCandidates(image, PHOTO_URL)).toEqual([PHOTO]);
		});

		it("drops a best url that is the url of the menu", () => {
			mocks.findBestImage.mockReturnValueOnce(PHOTO);

			expect(collectMediaCandidates(image, PHOTO_URL)).toEqual([PHOTO]);
		});

		it("keeps the first of two candidates with one url", () => {
			mocks.findLinkedMedia.mockReturnValueOnce({
				type: MEDIA_TYPE.VIDEO,
				url: BEST_URL,
			});
			mocks.findBestImage.mockReturnValueOnce(BEST);

			expect(collectMediaCandidates(image, PHOTO_URL)).toEqual([
				{ type: MEDIA_TYPE.VIDEO, url: BEST_URL },
				PHOTO,
			]);
		});
	});
});
