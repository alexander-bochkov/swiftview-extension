import type { Point } from "@shared/types";
import { getRotatedSize, scaleSize } from "./reducer/handlers/utils";
import type { ViewerState } from "./types";

const NO_TRANSLATE: Point = { x: 0, y: 0 };

export const selectIsReady = ({ container, image }: ViewerState): boolean =>
	container.width !== null && image.naturalWidth !== null;

// Returns the position of the image along one axis: from the start of its
// layout box, which is at the start of the container in the natural size, to
// where the transform moves it.
const getAxisTranslate = (
	container: number,
	natural: number,
	displayed: number,
	offset: number,
): number => {
	// The visible edge is rounded to whole px. At a fractional one, the browser
	// blends the edge pixels, which leaves a semi-transparent line along the
	// border of the container and blurs the image in its natural size.
	const rounded = Math.round((container - displayed) / 2 + offset);

	// An image larger than the container keeps covering it: the rounding must
	// not pull its far edge inside.
	const edge =
		displayed > container
			? Math.min(0, Math.max(container - displayed, rounded))
			: rounded;

	// The transform scales and turns the layout box around its center, so the
	// visible edge is half of the size difference away from the box edge.
	return edge - (natural - displayed) / 2;
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
