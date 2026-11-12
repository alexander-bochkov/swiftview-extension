import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { withViewerBackdrop } from "../../../../../.storybook/decorators";
import { Button } from "../button";
import { Icon } from "../icon";
import { Toolbar } from "./toolbar";

type Metadata = Meta<typeof Toolbar>;
type Story = StoryObj<Metadata>;

export default {
	args: {
		onClose: fn(),
	},
	component: Toolbar,
	decorators: [withViewerBackdrop],
	title: "Toolbar",
} satisfies Metadata;

// Only the close button: while the media loads, after it failed, or for a
// viewer without tools.
export const Default: Story = {};

export const WithTools: Story = {
	args: {
		tools: (
			<>
				<Button>
					<Icon name="rotate-right" />
				</Button>
				<Button>
					<Icon name="rotate-left" />
				</Button>
			</>
		),
	},
};
