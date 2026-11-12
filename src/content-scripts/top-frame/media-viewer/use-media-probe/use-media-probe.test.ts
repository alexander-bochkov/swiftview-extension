import { MEDIA_TYPE } from "@shared/constants";
import type { MediaCandidate, MediaElement } from "@shared/types";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMediaProbe } from "./use-media-probe";

const mocks = vi.hoisted(() => ({
	probeMedia:
		vi.fn<
			(candidate: MediaCandidate, signal: AbortSignal) => Promise<MediaElement>
		>(),
}));

vi.mock("./probe-media", () => ({ probeMedia: mocks.probeMedia }));

const CLIP: MediaCandidate = {
	type: MEDIA_TYPE.VIDEO,
	url: "https://example.com/clip.mp4",
};
const PHOTO: MediaCandidate = {
	type: MEDIA_TYPE.IMAGE,
	url: "https://example.com/photo.png",
};

const CANDIDATES = [CLIP, PHOTO];

// A probe the test settles itself, which rejects when its signal aborts, as
// the real one does.
const defer = () => {
	let resolve!: (element: MediaElement) => void;
	let reject!: (reason: unknown) => void;

	const promise = new Promise<MediaElement>((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return { promise, reject, resolve };
};

describe("useMediaProbe", () => {
	const image = document.createElement("img");
	const video = document.createElement("video");

	// Vitest globals are off, so Testing Library can't register this itself.
	afterEach(() => {
		cleanup();
		vi.resetAllMocks();
	});

	const renderProbe = (candidates: readonly MediaCandidate[] = CANDIDATES) => {
		const probes = candidates.map(() => defer());
		let index = 0;

		mocks.probeMedia.mockImplementation((_, signal) => {
			const probe = probes[index++] ?? defer();
			signal.addEventListener("abort", () => probe.reject(signal.reason));

			return probe.promise;
		});

		const rendered = renderHook(() => useMediaProbe(candidates));

		return { ...rendered, probes };
	};

	const getSignal = (call = 0): AbortSignal => {
		const signal = mocks.probeMedia.mock.calls[call]?.[1];
		if (!signal) throw new Error("probeMedia was not called");

		return signal;
	};

	it("is loading at first", () => {
		const { result } = renderProbe();

		expect(result.current).toEqual({ status: "loading" });
	});

	it("probes the first candidate only", () => {
		renderProbe();

		expect(mocks.probeMedia).toHaveBeenCalledExactlyOnceWith(
			CLIP,
			expect.any(AbortSignal),
		);
	});

	it("is loaded with the element of the first candidate that loads", async () => {
		const { probes, result } = renderProbe();

		await act(async () => probes[0]?.resolve(video));

		expect(result.current).toEqual({ element: video, status: "loaded" });
		expect(mocks.probeMedia).toHaveBeenCalledOnce();
	});

	it("probes the next candidate after a failure", async () => {
		const { probes, result } = renderProbe();

		await act(async () => probes[0]?.reject(new Error("failed")));

		expect(mocks.probeMedia).toHaveBeenLastCalledWith(
			PHOTO,
			expect.any(AbortSignal),
		);
		expect(result.current).toEqual({ status: "loading" });

		await act(async () => probes[1]?.resolve(image));

		expect(result.current).toEqual({ element: image, status: "loaded" });
	});

	it("has failed once the last candidate failed", async () => {
		const { probes, result } = renderProbe();

		await act(async () => probes[0]?.reject(new Error("failed")));
		await act(async () => probes[1]?.reject(new Error("failed")));

		await waitFor(() => expect(result.current).toEqual({ status: "failed" }));
	});

	it("has failed without candidates", async () => {
		const { result } = renderProbe([]);

		await waitFor(() => expect(result.current).toEqual({ status: "failed" }));
		expect(mocks.probeMedia).not.toHaveBeenCalled();
	});

	it("probes every candidate with the same signal", async () => {
		const { probes } = renderProbe();

		await act(async () => probes[0]?.reject(new Error("failed")));

		expect(getSignal(1)).toBe(getSignal(0));
	});

	describe("on unmount", () => {
		it("aborts the probe", () => {
			const { unmount } = renderProbe();

			unmount();

			expect(getSignal().aborted).toBe(true);
		});

		it("doesn't probe the next candidate", async () => {
			const { unmount } = renderProbe();

			unmount();
			// Lets the rejection of the aborted probe settle.
			await act(async () => {});

			expect(mocks.probeMedia).toHaveBeenCalledOnce();
		});
	});
});
