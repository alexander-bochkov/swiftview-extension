import type { ComponentProps } from "react";
import type { ViewerStore } from "../use-viewer-store";

type UseImageOptions = {
	store: ViewerStore;
};

type UseImageReturn = Pick<ComponentProps<"img">, "style">;

export const useImage = ({
	store: {
		state: { rotation, scaleX, scaleY },
	},
}: UseImageOptions): UseImageReturn => ({
	style: {
		// `scale` must come before `rotate`: each function transforms the
		// coordinate space left to right, so the flip happens along the screen
		// axes. In the opposite order it would follow the rotated image axes.
		transform: `scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`,
	},
});
