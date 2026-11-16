import type { Meta, StoryObj } from "@storybook/react-vite";
import { withViewerBackdrop } from "../../../../../.storybook/decorators";
import { MediaError } from "./media-error";

type Metadata = Meta<typeof MediaError>;
type Story = StoryObj<Metadata>;

export default {
	component: MediaError,
	decorators: [withViewerBackdrop],
	title: "MediaError",
} satisfies Metadata;

export const Default: Story = {};
