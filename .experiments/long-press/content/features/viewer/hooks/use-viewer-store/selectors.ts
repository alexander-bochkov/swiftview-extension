import type { Point } from "../../../../../shared/types";
import { ZERO_POINT } from "./constants";
import type { ViewerState } from "./types";
import { getRotatedSize, scaleSize } from "./utils";

export const selectIsReady = ({
	containerSize,
	naturalSize,
}: ViewerState): boolean => containerSize !== null && naturalSize !== null;

// Returns how far the image must move along one axis for its visible edge to
// go from where it is to where it should be. Both distances are measured from
// the start of the container, where the layout box sits in the natural size.
const getAxisTranslate = (
	container: number,
	natural: number,
	displayed: number,
	offset: number,
): number => {
	// Centered in the container and moved by the offset. The edge is rounded to
	// whole px: at a fractional one, the browser blends the edge pixels, which
	// leaves a semi-transparent line along the border of the container and blurs
	// the image in its natural size.
	const offsetDistance = Math.round((container - displayed) / 2 + offset);

	// An image larger than the container keeps covering it: the rounding must
	// not pull its far edge inside.
	const targetDistance =
		displayed > container
			? Math.min(Math.max(container - displayed, offsetDistance), 0)
			: offsetDistance;

	// The transform scales and turns the layout box around its center, so the
	// visible edge is half of the size difference away from the box edge.
	const currentDistance = (natural - displayed) / 2;

	return targetDistance - currentDistance;
};

export const selectImageTranslate = ({
	containerSize,
	naturalSize,
	offset,
	rotation,
	scale,
}: ViewerState): Point => {
	if (!containerSize || !naturalSize) return ZERO_POINT;

	const displayed = scaleSize(getRotatedSize(naturalSize, rotation), scale);

	return {
		x: getAxisTranslate(
			containerSize.width,
			naturalSize.width,
			displayed.width,
			offset.x,
		),
		y: getAxisTranslate(
			containerSize.height,
			naturalSize.height,
			displayed.height,
			offset.y,
		),
	};
};
