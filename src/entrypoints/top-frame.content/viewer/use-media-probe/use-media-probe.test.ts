import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MEDIA_TYPE } from "@/shared/constants";
import type { MediaCandidate, MediaElement } from "@/shared/types";
import { useMediaProbe } from "./use-media-probe";

const mocks = vi.hoisted(() => ({
	probeFirst:
		vi.fn<
			(
				candidates: MediaCandidate[],
				signal: AbortSignal,
			) => Promise<MediaElement>
		>(),
}));

vi.mock("./probe-first", () => ({ probeFirst: mocks.probeFirst }));

const CLIP: MediaCandidate = {
	type: MEDIA_TYPE.VIDEO,
	url: "https://example.com/clip.mp4",
};
const PHOTO: MediaCandidate = {
	type: MEDIA_TYPE.IMAGE,
	url: "https://example.com/photo.png",
};

// A probe the test settles itself, which rejects when its signal aborts, as
// the real one does.
const defer = (signal: AbortSignal) => {
	let resolve!: (element: MediaElement) => void;
	let reject!: (reason: unknown) => void;

	const promise = new Promise<MediaElement>((res, rej) => {
		resolve = res;
		reject = rej;
	});

	signal.addEventListener("abort", () => reject(signal.reason));

	return { promise, reject, resolve };
};

describe("useMediaProbe", () => {
	const image = document.createElement("img");
	const video = document.createElement("video");

	afterEach(() => {
		vi.resetAllMocks();
	});

	const renderProbe = (candidates = [CLIP]) => {
		const probes: ReturnType<typeof defer>[] = [];

		mocks.probeFirst.mockImplementation((_, signal) => {
			const probe = defer(signal);
			probes.push(probe);

			return probe.promise;
		});

		const rendered = renderHook((props) => useMediaProbe(props), {
			initialProps: candidates,
		});

		return { ...rendered, probes };
	};

	const getSignal = (call = 0): AbortSignal => {
		const signal = mocks.probeFirst.mock.calls[call]?.[1];
		if (!signal) throw new Error("probeFirst was not called");

		return signal;
	};

	it("is loading at first", () => {
		const { result } = renderProbe();

		expect(result.current).toEqual({ status: "loading" });
	});

	it("probes the candidates", () => {
		const candidates = [CLIP, PHOTO];

		renderProbe(candidates);

		expect(mocks.probeFirst).toHaveBeenCalledExactlyOnceWith(
			candidates,
			expect.any(AbortSignal),
		);
	});

	it("is loaded with the element the probe gives", async () => {
		const { probes, result } = renderProbe();

		await act(async () => probes[0]?.resolve(video));

		expect(result.current).toEqual({ element: video, status: "loaded" });
	});

	it("has failed when the probe rejects", async () => {
		const { probes, result } = renderProbe();

		await act(async () => probes[0]?.reject(new Error("failed")));

		expect(result.current).toEqual({ status: "failed" });
	});

	it("aborts the probe on unmount", () => {
		const { unmount } = renderProbe();

		unmount();

		expect(getSignal().aborted).toBe(true);
	});

	describe("on new candidates", () => {
		it("aborts the probe of the old ones", () => {
			const { rerender } = renderProbe();

			rerender([PHOTO]);

			expect(getSignal().aborted).toBe(true);
		});

		it("probes the new ones", () => {
			const { rerender } = renderProbe();

			rerender([PHOTO]);

			expect(mocks.probeFirst).toHaveBeenLastCalledWith(
				[PHOTO],
				expect.any(AbortSignal),
			);
		});

		it("is loading again", async () => {
			const { probes, rerender, result } = renderProbe();
			await act(async () => probes[0]?.resolve(video));

			rerender([PHOTO]);

			expect(result.current).toEqual({ status: "loading" });
		});

		it("doesn't fail when the old probe is aborted", async () => {
			const { probes, rerender, result } = renderProbe();

			rerender([PHOTO]);
			// Lets the rejection of the aborted probe settle.
			await act(async () => {});

			expect(result.current).toEqual({ status: "loading" });

			await act(async () => probes[1]?.resolve(image));

			expect(result.current).toEqual({ element: image, status: "loaded" });
		});
	});
});
