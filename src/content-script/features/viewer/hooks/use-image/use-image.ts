import type { Nullable, Point } from "@shared/types";
import {
	type ComponentProps,
	type CSSProperties,
	type RefObject,
	useEffect,
	useEffectEvent,
	useState,
} from "react";
import type { ViewerStore, Zoom } from "../use-viewer-store";
import {
	getFitScale,
	getVisualSize,
	MAX_SCALE,
	type Size,
	zoomAt,
} from "./layout";
import { getWheelZoomFactor } from "./wheel";

type UseImageOptions = {
	container: RefObject<Nullable<HTMLElement>>;
	store: ViewerStore;
};

type UseImageReturn = Pick<
	ComponentProps<"img">,
	"onClick" | "onLoad" | "style"
>;

const NO_OFFSET: Point = { x: 0, y: 0 };

const getCursor = (
	zoom: Nullable<Zoom>,
	fitScale: number,
): CSSProperties["cursor"] => {
	if (zoom) return "zoom-out";

	return fitScale < 1 ? "zoom-in" : undefined;
};

export const useImage = ({
	container,
	store: {
		dispatch,
		state: { rotation, scaleX, scaleY, zoom },
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
			dispatch({ type: "RESET_ZOOM" });
		});

		observer.observe(element);

		return () => observer.disconnect();
	}, [container, dispatch]);

	const isSideways = rotation % 180 !== 0;
	const visualSize = naturalSize && getVisualSize(naturalSize, isSideways);

	const fitScale =
		visualSize && containerSize ? getFitScale(visualSize, containerSize) : 1;

	const scale = zoom?.scale ?? fitScale;
	const offset = zoom?.offset ?? NO_OFFSET;

	// Zooms to `nextScale` around a point of the viewport.
	const zoomTo = (nextScale: number, { x, y }: Point): void => {
		const element = container.current;
		if (!element || !visualSize || !containerSize) return;

		const clampedScale = Math.min(nextScale, MAX_SCALE);

		if (clampedScale <= fitScale) {
			dispatch({ type: "RESET_ZOOM" });
			return;
		}

		if (clampedScale === scale) return;

		const rect = element.getBoundingClientRect();
		const point = {
			x: x - rect.left - rect.width / 2,
			y: y - rect.top - rect.height / 2,
		};

		dispatch({
			payload: zoomAt({
				container: containerSize,
				image: visualSize,
				point,
				scale: clampedScale,
				zoom: { offset, scale },
			}),
			type: "ZOOM",
		});
	};

	const handleWheel = useEffectEvent((e: WheelEvent): void => {
		// Also keeps the browser from zooming the page on a pinch.
		e.preventDefault();

		const factor = getWheelZoomFactor(e);
		if (factor !== null) zoomTo(scale * factor, { x: e.clientX, y: e.clientY });
	});

	// A React wheel listener is passive, so it couldn't prevent the default.
	useEffect(() => {
		const element = container.current;
		if (!element) return;

		const controller = new AbortController();

		element.addEventListener("wheel", (e) => handleWheel(e), {
			passive: false,
			signal: controller.signal,
		});

		return () => controller.abort();
	}, [container]);

	return {
		onClick: ({ clientX, clientY }) => {
			if (zoom) dispatch({ type: "RESET_ZOOM" });
			else zoomTo(1, { x: clientX, y: clientY });
		},
		onLoad: ({ currentTarget }) => {
			setNaturalSize({
				height: currentTarget.naturalHeight,
				width: currentTarget.naturalWidth,
			});
		},
		style: {
			cursor: getCursor(zoom, fitScale),

			// The `translate` and `scale` properties are applied together with
			// `transform`, in this order: `translate`, `scale`, `transform`. So the
			// zoom never interferes with the flips and the rotation below, and the
			// offset stays in screen px.
			scale,

			// `scale()` must come before `rotate()`: each function transforms the
			// coordinate space left to right, so the flip happens along the screen
			// axes. In the opposite order it would follow the rotated image axes.
			transform: `scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`,

			translate: `${offset.x}px ${offset.y}px`,
		},
	};
};
