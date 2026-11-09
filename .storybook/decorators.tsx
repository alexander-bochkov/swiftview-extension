import type { Decorator } from "@storybook/react-vite";
import { FONT_FAMILY } from "../src/content/viewer-host/fonts";

// The viewer as it is on a page: the backdrop of the overlay, with its font.
// The components inside are positioned absolutely, so it is sized.
export const withViewerBackdrop: Decorator = (Story) => (
	<div
		style={{
			backgroundColor: "rgb(0 0 0 / 80%)",
			fontFamily: `"${FONT_FAMILY}", sans-serif`,
			height: 400,
			position: "relative",
		}}
	>
		<Story />
	</div>
);
