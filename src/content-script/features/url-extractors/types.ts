import type { Nullable } from "@shared/types";

export type UrlExtractor = {
	extract: (elements: readonly Element[]) => Nullable<string>;
};
