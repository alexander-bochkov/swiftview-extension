import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";
import { Overlay } from "./overlay";

type Metadata = Meta<typeof Overlay>;
type Story = StoryObj<Metadata>;

export default {
	component: Overlay,
	title: "Overlay",
} satisfies Metadata;

export const WithActivationButton: Story = {
	render: () => {
		const ref = useRef<HTMLDialogElement>(null);

		const handleOpen = () => {
			ref.current?.showModal();
		};

		const handleClose = () => {
			ref.current?.close();
		};

		return (
			<>
				<button onClick={handleOpen} type="button">
					Open Overlay
				</button>
				<Overlay ref={ref}>
					<button onClick={handleClose} type="button">
						Close Overlay
					</button>
				</Overlay>
			</>
		);
	},
};
