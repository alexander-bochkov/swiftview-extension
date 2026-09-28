import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "../icon";
import { Button } from "./button";

const meta: Meta<typeof Button> = {
	component: Button,
	title: "Button",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const WithAllIcons: Story = {
	render: () => (
		<>
			<Button>
				<Icon name="flip-horizontal" />
			</Button>
			<br />
			<Button>
				<Icon name="flip-vertical" />
			</Button>
			<br />
			<Button>
				<Icon name="rotate-left" />
			</Button>
			<br />
			<Button>
				<Icon name="rotate-right" />
			</Button>
			<br />
			<Button>
				<Icon name="xmark" />
			</Button>
		</>
	),
};
