import type { ComponentProps } from "react";
import type { Viewer } from "../../types";

type UseImageOptions = {
	viewer: Viewer;
};

type UseImageReturn = Pick<ComponentProps<"img">, "style">;

export const useImage = ({
	viewer: {
		state: { flipX, flipY, rotation },
	},
}: UseImageOptions): UseImageReturn => ({
	style: {
		// `scale` must come before `rotate`: each function transforms the
		// coordinate space left to right, so the flip happens along the screen
		// axes. In the opposite order it would follow the rotated image axes.
		transform: `scale(${flipX}, ${flipY}) rotate(${rotation}deg)`,
	},
});
