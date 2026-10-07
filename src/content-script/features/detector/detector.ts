import type { Nullable } from "@shared/types";
import type { UrlExtractor } from "../url-extractors";

export class Detector {
	private readonly extractors: readonly UrlExtractor[];

	constructor(extractors: readonly UrlExtractor[]) {
		this.extractors = extractors;
	}

	detectUrl(x: number, y: number): Nullable<string> {
		const elements = document.elementsFromPoint(x, y);

		for (const extractor of this.extractors) {
			const url = extractor.extract(elements);
			if (url) return url;
		}

		return null;
	}
}
