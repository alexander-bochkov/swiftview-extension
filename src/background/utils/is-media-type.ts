import { MEDIA_TYPE } from "@shared/constants";
import type { MediaType } from "@shared/types";

export const isMediaType = (value: unknown): value is MediaType =>
	Object.values(MEDIA_TYPE).some((type) => type === value);
