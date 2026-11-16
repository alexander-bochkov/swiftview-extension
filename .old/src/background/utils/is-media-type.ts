import { MEDIA_TYPES } from "@shared/constants";
import type { MediaType } from "@shared/types";

export const isMediaType = (value: unknown): value is MediaType =>
	MEDIA_TYPES.some((type) => type === value);
