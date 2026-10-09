import { KEY_CODE } from "@shared/constants";
import { type KeyboardEvent, type MouseEvent, useEffect, useRef } from "react";
import { Button, Icon } from "../../components";
import styles from "./viewer.module.css";

type ViewerProps = {
	onClose: () => void;
	url: string;
};

export const Viewer = ({ onClose, url }: ViewerProps) => {
	const ref = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		ref.current?.showModal();
	}, []);

	const handleClick = ({ target }: MouseEvent) => {
		if (target === ref.current) onClose();
	};

	const handleKeyDown = ({ code }: KeyboardEvent) => {
		if (code === KEY_CODE.ESCAPE) onClose();
	};

	return (
		<dialog
			className={styles.viewer}
			closedby="none"
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			ref={ref}
		>
			<Button className={styles.close} onClick={onClose}>
				<Icon name="x-mark" />
			</Button>
			<img alt="" className={styles.image} draggable={false} src={url} />
		</dialog>
	);
};
