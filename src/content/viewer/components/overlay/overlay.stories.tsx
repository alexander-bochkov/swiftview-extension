import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { Overlay } from "./overlay";

type Metadata = Meta<typeof Overlay>;
type Story = StoryObj<Metadata>;

export default {
	component: Overlay,
	title: "Overlay",
} satisfies Metadata;

export const WithActivationButton: Story = {
	render: () => {
		const [isOpen, setIsOpen] = useState(false);
		const ref = useRef<HTMLDialogElement>(null);

		return (
			<>
				<button onClick={() => setIsOpen(true)} type="button">
					Open Overlay
				</button>
				{isOpen && (
					<Overlay onClose={() => setIsOpen(false)} ref={ref}>
						{({ onRequestClose }) => (
							<button onClick={onRequestClose} type="button">
								Close Overlay
							</button>
						)}
					</Overlay>
				)}
			</>
		);
	},
};
