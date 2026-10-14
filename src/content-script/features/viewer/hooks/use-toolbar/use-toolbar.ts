import type { ComponentProps } from "react";
import type { Toolbar } from "../../toolbar";
import type { ViewerStore } from "../use-viewer-store";

type UseToolbarOptions = {
	onClose: () => void;
	store: ViewerStore;
};

export const useToolbar = ({
	onClose,
	store: { dispatch },
}: UseToolbarOptions): ComponentProps<typeof Toolbar> => ({
	onClose,
	onFlip: (direction) => dispatch({ payload: direction, type: "FLIP" }),
	onRotate: (direction) => dispatch({ payload: direction, type: "ROTATE" }),
});
