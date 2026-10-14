import type { ComponentProps } from "react";
import type { Toolbar } from "../../toolbar";
import type { Viewer } from "../use-viewer";

type UseToolbarOptions = {
	onClose: () => void;
	viewer: Viewer;
};

export const useToolbar = ({
	onClose,
	viewer: { dispatch },
}: UseToolbarOptions): ComponentProps<typeof Toolbar> => ({
	onClose,
	onFlip: (direction) => dispatch({ payload: direction, type: "FLIP" }),
	onRotate: (direction) => dispatch({ payload: direction, type: "ROTATE" }),
});
