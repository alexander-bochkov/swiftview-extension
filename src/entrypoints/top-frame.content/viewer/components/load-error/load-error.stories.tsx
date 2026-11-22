import type { Meta, StoryObj } from "@storybook/react-vite";
import { withViewerBackdrop } from "../../../../../../.storybook/decorators";
import { LoadError } from "./load-error";

type Metadata = Meta<typeof LoadError>;
type Story = StoryObj<Metadata>;

export default {
	component: LoadError,
	decorators: [withViewerBackdrop],
	title: "LoadError",
} satisfies Metadata;

export const Default: Story = {};
