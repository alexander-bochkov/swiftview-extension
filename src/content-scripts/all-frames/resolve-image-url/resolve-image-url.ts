import type { Nullable, Point } from "@shared/types";

// A better quality url of the image than the one of the menu, from the
// elements under the point where the menu was opened. Null when there is none,
// or the frame hasn't seen the menu open.
//
// TODO: look for a better url under the point, see .experiments/long-press.
export const resolveImageUrl = (_point: Nullable<Point>): Nullable<string> => {
	return null;
};
