import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { withViewerBackdrop } from "../../../../../.storybook/decorators";
import { Toolbar } from "./toolbar";

type Metadata = Meta<typeof Toolbar>;
type Story = StoryObj<Metadata>;

export default {
	args: {
		hideTools: false,
		onClose: fn(),
		onFlip: fn(),
		onRotate: fn(),
		scale: 1,
	},
	argTypes: {
		scale: { control: { max: 10, min: 0, step: 0.01, type: "range" } },
	},
	component: Toolbar,
	decorators: [withViewerBackdrop],
	title: "Toolbar",
} satisfies Metadata;

export const Default: Story = {};

export const ZoomedIn: Story = {
	args: { scale: 2.5 },
};

// A zoom under 1% is shown as 1%, not 0%.
export const ZoomedFarOut: Story = {
	args: { scale: 0.001 },
};

// While the image loads or after it failed, only the close button is shown.
export const WithoutTools: Story = {
	args: { hideTools: true },
};
