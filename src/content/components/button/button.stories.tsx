import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon, type IconName } from "../icon";
import { Button } from "./button";

type Metadata = Meta<typeof Button>;
type Story = StoryObj<Metadata>;

const ICON_NAMES: IconName[] = [
	"flip-horizontal",
	"flip-vertical",
	"rotate-left",
	"rotate-right",
	"x-mark",
];

export default {
	component: Button,
	title: "Button",
} satisfies Metadata;

export const WithIcons: Story = {
	render: () => (
		<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
			{ICON_NAMES.map((icon) => (
				<Button key={icon}>
					<Icon name={icon} />
				</Button>
			))}
		</div>
	),
};
