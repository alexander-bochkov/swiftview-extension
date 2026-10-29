import { type ComponentProps, type RefObject, useEffect } from "react";
import type { Nullable, Point } from "../../../../../shared/types";
import { hasModifierKey } from "../../../../../shared/utils";
import type { ViewerStore } from "../use-viewer-store";

type UseImageZoomOptions = {
	containerRef: RefObject<Nullable<HTMLElement>>;
	store: ViewerStore;
};

type UseImageZoomReturn = Pick<ComponentProps<"img">, "onClick">;

// About 10% per notch of a mouse wheel.
const ZOOM_SENSITIVITY = 0.001;

const getZoomFactor = (deltaY: number): number => {
	// `exp()` makes steps in and out symmetric, so scrolling back returns to
	// the same scale, and keeps the factor above 0 for any delta.
	return Math.exp(-deltaY * ZOOM_SENSITIVITY);
};

const getContainerPoint = (
	container: HTMLElement,
	{ clientX, clientY }: Pick<MouseEvent, "clientX" | "clientY">,
): Point => {
	const { height, left, top, width } = container.getBoundingClientRect();

	return {
		x: clientX - left - width / 2,
		y: clientY - top - height / 2,
	};
};

export const useImageZoom = ({
	containerRef,
	store: { dispatch },
}: UseImageZoomOptions): UseImageZoomReturn => {
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const controller = new AbortController();

		const handleWheel = (e: WheelEvent) => {
			e.preventDefault();
			if (hasModifierKey(e) || e.deltaY === 0) return;

			const factor = getZoomFactor(e.deltaY);
			const point = getContainerPoint(container, e);

			dispatch({ payload: { factor, point }, type: "ZOOM" });
		};

		container.addEventListener("wheel", handleWheel, {
			passive: false,
			signal: controller.signal,
		});

		return () => controller.abort();
	}, [containerRef, dispatch]);

	return {
		onClick: (e) => {
			if (!containerRef.current || hasModifierKey(e)) return;

			const point = getContainerPoint(containerRef.current, e);
			dispatch({ payload: point, type: "TOGGLE_ZOOM" });
		},
	};
};
