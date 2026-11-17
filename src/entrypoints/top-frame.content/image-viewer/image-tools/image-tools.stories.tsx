import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { withViewerBackdrop } from "../../../../../.storybook/decorators";
import { Toolbar } from "../../components";
import { ImageTools } from "./image-tools";

type Metadata = Meta<typeof ImageTools>;
type Story = StoryObj<Metadata>;

export default {
	args: {
		onFlip: fn(),
		onRotate: fn(),
		onToggleZoom: fn(),
		scale: 1,
	},
	argTypes: {
		scale: { control: { max: 10, min: 0, step: 0.01, type: "range" } },
	},
	component: ImageTools,
	decorators: [withViewerBackdrop],
	// In the toolbar, which places the tools.
	render: (args) => <Toolbar onClose={fn()} tools={<ImageTools {...args} />} />,
	title: "ImageTools",
} satisfies Metadata;

export const Default: Story = {};

export const ZoomedIn: Story = {
	args: { scale: 2.5 },
};

// A zoom under 1% is shown as 1%, not 0%.
export const ZoomedFarOut: Story = {
	args: { scale: 0.001 },
};
