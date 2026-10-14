import type { Nullable } from "@shared/types";
import {
	type ComponentProps,
	type RefObject,
	useEffect,
	useState,
} from "react";
import type { ViewerStore } from "../use-viewer-store";

type Size = {
	readonly height: number;
	readonly width: number;
};

type UseImageOptions = {
	container: RefObject<Nullable<HTMLElement>>;
	store: ViewerStore;
};

type UseImageReturn = Pick<ComponentProps<"img">, "onLoad" | "style">;

const getFitScale = (image: Size, container: Size): number => {
	const scaleX = container.width / image.width;
	const scaleY = container.height / image.height;

	return Math.min(scaleX, scaleY, 1);
};

const getVisualSize = (size: Size, isSideways: boolean): Size => {
	const height = isSideways ? size.width : size.height;
	const width = isSideways ? size.height : size.width;

	return { height, width };
};

export const useImage = ({
	container,
	store: {
		state: { rotation, scaleX, scaleY },
	},
}: UseImageOptions): UseImageReturn => {
	const [containerSize, setContainerSize] = useState<Nullable<Size>>(null);
	const [naturalSize, setNaturalSize] = useState<Nullable<Size>>(null);

	useEffect(() => {
		const element = container.current;
		if (!element) return;

		const observer = new ResizeObserver(([entry]) => {
			if (!entry) return;

			const { height, width } = entry.contentRect;
			setContainerSize({ height, width });
		});

		observer.observe(element);

		return () => observer.disconnect();
	}, [container]);

	const isSideways = rotation % 180 !== 0;
	const visualSize = naturalSize && getVisualSize(naturalSize, isSideways);

	const fitScale =
		visualSize && containerSize ? getFitScale(visualSize, containerSize) : 1;

	return {
		onLoad: ({ currentTarget }) => {
			setNaturalSize({
				height: currentTarget.naturalHeight,
				width: currentTarget.naturalWidth,
			});
		},
		style: {
			// The `scale` property is applied together with `transform` (after
			// `translate` and `rotate`), so the fit never interferes with the flips
			// and the rotation below.
			scale: fitScale,

			// `scale()` must come before `rotate()`: each function transforms the
			// coordinate space left to right, so the flip happens along the screen
			// axes. In the opposite order it would follow the rotated image axes.
			transform: `scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`,
		},
	};
};
