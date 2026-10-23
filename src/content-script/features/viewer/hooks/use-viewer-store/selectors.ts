import type { ViewerState } from "./types";

export const selectIsReady = ({ container, image }: ViewerState): boolean =>
	container.width !== null && image.width !== null;
