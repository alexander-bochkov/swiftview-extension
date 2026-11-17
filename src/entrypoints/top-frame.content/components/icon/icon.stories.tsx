import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon, type IconName } from "./icon";

type Metadata = Meta<typeof Icon>;
type Story = StoryObj<Metadata>;

const ICON_NAMES: IconName[] = [
	"flip-horizontal",
	"flip-vertical",
	"no-symbol",
	"rotate-left",
	"rotate-right",
	"spinner",
	"x-mark",
];

export default {
	component: Icon,
	title: "Icon",
} satisfies Metadata;

export const AllIcons: Story = {
	render: () => (
		<>
			{ICON_NAMES.map((icon) => (
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
