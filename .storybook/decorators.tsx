import type { Decorator } from "@storybook/react-vite";
import { FONT_FAMILY } from "../src/entrypoints/top-frame.content/viewer-host/fonts";

// The font the viewer host gives the viewer on a page. The modal of the overlay
// inherits it too, as the top layer keeps the inheritance of the DOM.
export const withViewerFont: Decorator = (Story) => (
	<div style={{ fontFamily: `"${FONT_FAMILY}", sans-serif` }}>
		<Story />
	</div>
);

// The viewer as it is on a page: the backdrop of the overlay. The components
// inside are positioned absolutely, so it is sized.
export const withViewerBackdrop: Decorator = (Story) => (
	<div
		style={{
			backgroundColor: "rgb(0 0 0 / 80%)",
			height: 400,
			position: "relative",
		}}
	>
		<Story />
	</div>
);
