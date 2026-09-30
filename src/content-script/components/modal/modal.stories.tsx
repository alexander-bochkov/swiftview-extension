import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";
import { Modal } from "./modal";

type Metadata = Meta<typeof Modal>;
type Story = StoryObj<Metadata>;

export default {
	component: Modal,
	title: "Modal",
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
					Open Modal
				</button>
				<Modal onClose={handleClose} ref={ref} />
			</>
		);
	},
};
