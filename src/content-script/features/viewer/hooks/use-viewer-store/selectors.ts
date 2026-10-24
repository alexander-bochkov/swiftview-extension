import type { Point } from "@shared/types";
import { getRotatedSize, scaleSize } from "./reducer/handlers/utils";
import type { ViewerState } from "./types";

const NO_TRANSLATE: Point = { x: 0, y: 0 };

export const selectIsReady = ({ container, image }: ViewerState): boolean =>
	container.width !== null && image.naturalWidth !== null;

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
	container,
	image,
}: ViewerState): Point => {
	if (
		container.height === null ||
		container.width === null ||
		image.naturalHeight === null ||
		image.naturalWidth === null
	) {
		return NO_TRANSLATE;
	}

	const displayed = scaleSize(
		getRotatedSize(
			{ height: image.naturalHeight, width: image.naturalWidth },
			image.rotation,
		),
		image.scale,
	);

	return {
		x: getAxisTranslate(
			container.width,
			image.naturalWidth,
			displayed.width,
			image.offsetX,
		),
		y: getAxisTranslate(
			container.height,
			image.naturalHeight,
			displayed.height,
			image.offsetY,
		),
	};
};
