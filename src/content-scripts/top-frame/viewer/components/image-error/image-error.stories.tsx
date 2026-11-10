import type { Meta, StoryObj } from "@storybook/react-vite";
import { withViewerBackdrop } from "../../../../../../.storybook/decorators";
import { ImageError } from "./image-error";

type Metadata = Meta<typeof ImageError>;
type Story = StoryObj<Metadata>;

export default {
	component: ImageError,
	decorators: [withViewerBackdrop],
	title: "ImageError",
} satisfies Metadata;

export const Default: Story = {};
