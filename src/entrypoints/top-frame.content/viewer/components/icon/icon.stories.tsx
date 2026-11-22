import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon, type IconName } from "./icon";

type Metadata = Meta<typeof Icon>;
type Story = StoryObj<Metadata>;

// Found from the files, so a new icon shows up without a change here.
const ICON_NAMES = Object.keys(import.meta.glob("./icons/*.svg")).map(
	(path) => path.replace("./icons/", "").replace(".svg", "") as IconName,
);

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
