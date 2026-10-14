import type { Viewer } from "../../types";

type UseImageOptions = {
	viewer: Viewer;
};

export const useImage = ({ viewer: { state } }: UseImageOptions) => ({
	style: {
		transform: `scale(${state.flipX}, ${state.flipY}) rotate(${state.rotation}deg)`,
	},
});
