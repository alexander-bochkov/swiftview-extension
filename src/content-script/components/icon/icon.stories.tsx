import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentPropsWithoutRef } from "react";
import { Icon } from "./icon";

type Metadata = Meta<typeof Icon>;
type Story = StoryObj<Metadata>;

const ICONS: Array<ComponentPropsWithoutRef<typeof Icon>["name"]> = [
	"flip-horizontal",
	"flip-vertical",
	"rotate-left",
	"rotate-right",
	"x-mark",
];

export default {
	component: Icon,
	title: "Icon",
} satisfies Metadata;

export const AllIcons: Story = {
	render: () => (
		<>
			{ICONS.map((icon) => (
				<div
					key={icon}
					style={{
						alignItems: "center",
						display: "flex",
						gap: 10,
					}}
				>
					<Icon height={24} name={icon} width={24} />
					{icon}
				</div>
			))}
		</>
	),
};
