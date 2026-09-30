import { KEY_CODE } from "@shared/constants";
import type {
	KeyboardEvent,
	MouseEvent,
	PropsWithChildren,
	RefObject,
} from "react";
import { Button } from "../button";
import { Icon } from "../icon";
import styles from "./modal.module.css";

type ModalProps = {
	ref: RefObject<HTMLDialogElement | null>;
	onClose: () => void;
};

export const Modal = ({
	children,
	ref,
	onClose,
}: PropsWithChildren<ModalProps>) => {
	const handleClick = ({ target }: MouseEvent) => {
		if (target === ref.current) onClose();
	};

	const handleKeyDown = ({ code }: KeyboardEvent) => {
		if (code === KEY_CODE.ESCAPE) onClose();
	};

	return (
		<dialog
			className={styles.modal}
			closedby="none"
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			ref={ref}
		>
			<Button className={styles.close} onClick={onClose}>
				<Icon name="x-mark" />
			</Button>
			{children}
		</dialog>
	);
};
