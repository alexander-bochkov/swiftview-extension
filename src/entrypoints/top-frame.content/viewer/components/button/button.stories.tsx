import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "../icon";
import { Button } from "./button";

type Metadata = Meta<typeof Button>;
type Story = StoryObj<Metadata>;

export default {
	component: Button,
	title: "Button",
} satisfies Metadata;

// The Toolbar and ImageTools stories show the buttons together.
export const WithIcon: Story = {
	args: {
		children: <Icon name="x-mark" />,
	},
};
