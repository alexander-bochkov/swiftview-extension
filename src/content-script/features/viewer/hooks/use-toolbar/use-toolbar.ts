import type { FlipDirection, RotateDirection, Viewer } from "../../types";

type UseToolbarOptions = {
	onClose: () => void;
	viewer: Viewer;
};

export const useToolbar = ({
	onClose,
	viewer: { dispatch },
}: UseToolbarOptions) =>
	({
		onClose,
		onFlip: (direction: FlipDirection) => {
			dispatch({ payload: direction, type: "FLIP" });
		},
		onRotate: (direction: RotateDirection) => {
			dispatch({ payload: direction, type: "ROTATE" });
		},
	}) as const;
