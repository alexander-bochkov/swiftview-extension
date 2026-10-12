// @vitest-environment node

import type { Nullable } from "@shared/types";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from "vitest";
import { Detector } from "./detector";

describe("Detector", () => {
	let elements: Element[];
	let elementsFromPoint: Mock<(x: number, y: number) => Element[]>;

	const createExtractor = (url: Nullable<string>) => ({
		extract: vi.fn((_: readonly Element[]) => url),
	});

	beforeEach(() => {
		// The detector only passes the elements on, so plain objects are enough.
		elements = [{}, {}] as unknown as Element[];
		elementsFromPoint = vi.fn(() => elements);

		vi.stubGlobal("document", { elementsFromPoint });
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	describe("detectUrl", () => {
		it("looks up the elements at the given point once", () => {
			const detector = new Detector([
				createExtractor(null),
				createExtractor(null),
			]);

			detector.detectUrl({ x: 10, y: 20 });

			expect(elementsFromPoint).toHaveBeenCalledExactlyOnceWith(10, 20);
		});

		it("gives every extractor the same elements", () => {
			const first = createExtractor(null);
			const second = createExtractor(null);

			new Detector([first, second]).detectUrl({ x: 0, y: 0 });

			expect(first.extract).toHaveBeenCalledOnce();
			expect(first.extract.mock.calls[0]?.[0]).toBe(elements);
			expect(second.extract).toHaveBeenCalledOnce();
			expect(second.extract.mock.calls[0]?.[0]).toBe(elements);
		});

		it("returns the url of the first extractor that finds one", () => {
			const first = createExtractor("https://example.com/first.png");
			const second = createExtractor("https://example.com/second.png");

			const url = new Detector([first, second]).detectUrl({ x: 0, y: 0 });

			expect(url).toBe("https://example.com/first.png");
			expect(second.extract).not.toHaveBeenCalled();
		});

		it("falls through to the next extractor when one finds nothing", () => {
			const first = createExtractor(null);
			const second = createExtractor("https://example.com/second.png");

			const url = new Detector([first, second]).detectUrl({ x: 0, y: 0 });

			expect(url).toBe("https://example.com/second.png");
			expect(first.extract).toHaveBeenCalledOnce();
		});

		it("treats an empty string as no url", () => {
			const first = createExtractor("");
			const second = createExtractor("https://example.com/second.png");

			const url = new Detector([first, second]).detectUrl({ x: 0, y: 0 });

			expect(url).toBe("https://example.com/second.png");
		});

		it("returns null when no extractor finds a url", () => {
			const detector = new Detector([
				createExtractor(null),
				createExtractor(null),
			]);

			expect(detector.detectUrl({ x: 0, y: 0 })).toBeNull();
		});

		it("returns null when there are no extractors", () => {
			expect(new Detector([]).detectUrl({ x: 0, y: 0 })).toBeNull();
		});
	});
});
