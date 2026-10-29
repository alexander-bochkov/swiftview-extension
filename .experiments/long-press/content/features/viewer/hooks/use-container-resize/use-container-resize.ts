import { type RefObject, useEffect } from "react";
import type { Nullable } from "../../../../../shared/types";
import type { ViewerStore } from "../use-viewer-store";

type UseContainerResizeOptions = {
	containerRef: RefObject<Nullable<HTMLElement>>;
	store: ViewerStore;
};

export const useContainerResize = ({
	containerRef,
	store: { dispatch },
}: UseContainerResizeOptions) => {
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const observer = new ResizeObserver(([entry]) => {
			if (!entry) return;

			const { height, width } = entry.contentRect;
			dispatch({ payload: { height, width }, type: "RESIZE" });
		});

		observer.observe(container);

		return () => observer.disconnect();
	}, [containerRef, dispatch]);
};
