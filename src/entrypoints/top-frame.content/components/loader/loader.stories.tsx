import type { Meta, StoryObj } from "@storybook/react-vite";
import { withViewerBackdrop } from "../../../../../.storybook/decorators";
import { Loader } from "./loader";

type Metadata = Meta<typeof Loader>;
type Story = StoryObj<Metadata>;

export default {
	component: Loader,
	decorators: [withViewerBackdrop],
	title: "Loader",
} satisfies Metadata;

export const Default: Story = {};
