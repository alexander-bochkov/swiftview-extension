import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CLIP, PHOTO } from "@/shared/test-utils";
import type { MediaCandidate, MediaElement } from "@/shared/types";
import { probeFirst } from "./probe-first";

const mocks = vi.hoisted(() => ({
	probeMedia:
		vi.fn<
			(candidate: MediaCandidate, signal: AbortSignal) => Promise<MediaElement>
		>(),
}));

vi.mock("../probe-media", () => ({ probeMedia: mocks.probeMedia }));

const CANDIDATES = [CLIP, PHOTO];

describe("probeFirst", () => {
	const image = document.createElement("img");
	const video = document.createElement("video");

	let controller: AbortController;

	beforeEach(() => {
		controller = new AbortController();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	it("gives the element of the first candidate that loads", async () => {
		mocks.probeMedia.mockResolvedValueOnce(video);

		await expect(probeFirst(CANDIDATES, controller.signal)).resolves.toBe(
			video,
		);
		expect(mocks.probeMedia).toHaveBeenCalledExactlyOnceWith(
			CLIP,
			controller.signal,
		);
	});

	it("probes the next candidate after a failure", async () => {
		mocks.probeMedia
			.mockRejectedValueOnce(new Error("failed"))
			.mockResolvedValueOnce(image);

		await expect(probeFirst(CANDIDATES, controller.signal)).resolves.toBe(
			image,
		);
		expect(mocks.probeMedia).toHaveBeenLastCalledWith(PHOTO, controller.signal);
	});

	it("rejects once every candidate failed", async () => {
		mocks.probeMedia.mockRejectedValue(new Error("failed"));

		await expect(probeFirst(CANDIDATES, controller.signal)).rejects.toThrow(
			/none of the candidates/i,
		);
		expect(mocks.probeMedia).toHaveBeenCalledTimes(2);
	});

	it("rejects without candidates", async () => {
		await expect(probeFirst([], controller.signal)).rejects.toThrow(
			/none of the candidates/i,
		);
		expect(mocks.probeMedia).not.toHaveBeenCalled();
	});

	describe("on abort", () => {
		const reason = new Error("aborted");

		// Aborted while the first candidate loads, which rejects, as the real
		// probe does.
		beforeEach(() => {
			mocks.probeMedia.mockImplementation(async (_, signal) => {
				controller.abort(reason);
				throw signal.reason;
			});
		});

		it("rejects with the reason", async () => {
			await expect(probeFirst(CANDIDATES, controller.signal)).rejects.toBe(
				reason,
			);
		});

		it("doesn't probe the next candidate", async () => {
			await probeFirst(CANDIDATES, controller.signal).catch(() => {});

			expect(mocks.probeMedia).toHaveBeenCalledOnce();
		});
	});
});
