import { MEDIA_TYPE } from "@shared/constants";
import type { MediaCandidate, MediaElement, MediaType } from "@shared/types";

export const PROBE_TIMEOUT_MS = 20_000;

const createElement = (type: MediaType): MediaElement => {
	if (type === MEDIA_TYPE.VIDEO) {
		const video = document.createElement("video");
		// Enough to know the video plays, without downloading it.
		video.preload = "metadata";

		return video;
	}

	return document.createElement("img");
};

const getLoadEvent = (element: MediaElement): string =>
	element instanceof HTMLVideoElement ? "loadedmetadata" : "load";

// An image without a size, such as an SVG without its own size in some
// browsers, can't be fitted or shown.
const hasSize = (element: MediaElement): boolean =>
	element instanceof HTMLVideoElement ||
	(element.naturalWidth > 0 && element.naturalHeight > 0);

const unload = (element: MediaElement): void => {
	element.removeAttribute("src");
	if (element instanceof HTMLVideoElement) element.load();
};

export const probeMedia = (
	{ type, url }: MediaCandidate,
	signal: AbortSignal,
): Promise<MediaElement> =>
	new Promise((resolve, reject) => {
		signal.throwIfAborted();

		const element = createElement(type);

		const listeners = new AbortController();
		const options = { once: true, signal: listeners.signal };

		const stopWaiting = (): void => {
			clearTimeout(timer);
			listeners.abort();
		};

		const fail = (reason: unknown): void => {
			stopWaiting();
			unload(element);
			reject(reason);
		};

		const timer = setTimeout(
			() => fail(new Error(`Timed out loading ${url}`)),
			PROBE_TIMEOUT_MS,
		);

		element.addEventListener(
			getLoadEvent(element),
			() => {
				if (!hasSize(element)) {
					fail(new Error(`No size in ${url}`));
					return;
				}

				stopWaiting();
				resolve(element);
			},
			options,
		);

		element.addEventListener(
			"error",
			() => fail(new Error(`Couldn't load ${url}`)),
			options,
		);

		signal.addEventListener("abort", () => fail(signal.reason), options);

		element.src = url;
	});
