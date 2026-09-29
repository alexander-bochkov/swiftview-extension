import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentPropsWithoutRef } from "react";
import { Icon } from "../icon";
import { Button } from "./button";

type Metadata = Meta<typeof Button>;
type Story = StoryObj<Metadata>;

const ICONS: Array<ComponentPropsWithoutRef<typeof Icon>["name"]> = [
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
		<>
			{ICONS.map((icon) => (
				<>
					<Button>
						<Icon name={icon} />
					</Button>
					<br />
				</>
			))}
		</>
	),
};
