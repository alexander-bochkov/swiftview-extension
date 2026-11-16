import { MEDIA_TYPE } from "@shared/constants";
import type { MediaCandidate, MediaElement } from "@shared/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PROBE_TIMEOUT_MS, probeMedia } from "./probe-media";

const CLIP: MediaCandidate = {
	type: MEDIA_TYPE.VIDEO,
	url: "https://example.com/clip.mp4",
};
const PHOTO: MediaCandidate = {
	type: MEDIA_TYPE.IMAGE,
	url: "https://example.com/photo.png",
};

describe("probeMedia", () => {
	let controller: AbortController;
	let created: Element[];

	// jsdom doesn't implement the media elements' load().
	const load = vi.fn();

	beforeEach(() => {
		vi.useFakeTimers();

		controller = new AbortController();
		created = [];

		// jsdom doesn't load images or videos, so the tests dispatch the events
		// on the element the probe creates.
		const createElement = document.createElement.bind(document);
		vi.spyOn(document, "createElement").mockImplementation((tagName) => {
			const element = createElement(tagName);
			created.push(element);

			return element;
		});

		HTMLMediaElement.prototype.load = load;
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	// The probe creates its element synchronously.
	const probe = (candidate: MediaCandidate) => {
		const promise = probeMedia(candidate, controller.signal);
		const element = created.at(-1) as MediaElement;

		return { element, promise };
	};

	// jsdom doesn't load images, so the natural size is reported by hand.
	const loadImage = (element: MediaElement, height = 200, width = 400) => {
		Object.defineProperties(element, {
			naturalHeight: { value: height },
			naturalWidth: { value: width },
		});
		element.dispatchEvent(new Event("load"));
	};

	describe("an image", () => {
		it("loads it into an img", () => {
			const { element } = probe(PHOTO);

			expect(element).toBeInstanceOf(HTMLImageElement);
			expect(element.src).toBe(PHOTO.url);
		});

		it("resolves with the img once it loaded", async () => {
			const { element, promise } = probe(PHOTO);

			loadImage(element);

			await expect(promise).resolves.toBe(element);
		});

		it("rejects and drops the url when it loaded without a size", async () => {
			const { element, promise } = probe(PHOTO);

			loadImage(element, 0, 0);

			await expect(promise).rejects.toThrow(/no size/i);
			expect(element.hasAttribute("src")).toBe(false);
		});
	});

	describe("a video", () => {
		it("loads it into a video, the metadata only", () => {
			const { element } = probe(CLIP);

			expect(element).toBeInstanceOf(HTMLVideoElement);
			expect(element.src).toBe(CLIP.url);
			expect((element as HTMLVideoElement).preload).toBe("metadata");
		});

		it("resolves with the video once its metadata loaded", async () => {
			const { element, promise } = probe(CLIP);

			element.dispatchEvent(new Event("loadedmetadata"));

			await expect(promise).resolves.toBe(element);
		});

		it("stops its download when it fails", async () => {
			const { element, promise } = probe(CLIP);

			element.dispatchEvent(new Event("error"));

			await expect(promise).rejects.toThrow();
			expect(element.hasAttribute("src")).toBe(false);
			expect(load).toHaveBeenCalledOnce();
		});
	});

	describe("failures", () => {
		it("rejects and drops the url on an error", async () => {
			const { element, promise } = probe(PHOTO);

			element.dispatchEvent(new Event("error"));

			await expect(promise).rejects.toThrow(/couldn't load/i);
			expect(element.hasAttribute("src")).toBe(false);
		});

		it("rejects and drops the url after the timeout", async () => {
			const { element, promise } = probe(PHOTO);

			vi.advanceTimersByTime(PROBE_TIMEOUT_MS);

			await expect(promise).rejects.toThrow(/timed out/i);
			expect(element.hasAttribute("src")).toBe(false);
		});

		it("keeps loading until the timeout", async () => {
			const { element, promise } = probe(PHOTO);

			vi.advanceTimersByTime(PROBE_TIMEOUT_MS - 1);
			loadImage(element);

			await expect(promise).resolves.toBe(element);
		});

		it("rejects and drops the url when aborted", async () => {
			const { element, promise } = probe(PHOTO);

			controller.abort();

			await expect(promise).rejects.toBe(controller.signal.reason);
			expect(element.hasAttribute("src")).toBe(false);
		});

		it("rejects without an element when aborted already", async () => {
			controller.abort();

			await expect(probeMedia(PHOTO, controller.signal)).rejects.toBe(
				controller.signal.reason,
			);
			expect(created).toEqual([]);
		});
	});

	describe("after the load", () => {
		it("ignores an error and the timeout", async () => {
			const { element, promise } = probe(PHOTO);

			loadImage(element);
			await promise;

			element.dispatchEvent(new Event("error"));
			vi.advanceTimersByTime(PROBE_TIMEOUT_MS);

			expect(element.src).toBe(PHOTO.url);
		});

		it("ignores an abort", async () => {
			const { element, promise } = probe(PHOTO);

			loadImage(element);
			await promise;

			controller.abort();

			expect(element.src).toBe(PHOTO.url);
		});
	});
});
