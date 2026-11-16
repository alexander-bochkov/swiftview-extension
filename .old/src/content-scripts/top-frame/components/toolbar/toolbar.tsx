import type { ReactNode } from "react";
import { Button } from "../button";
import { Icon } from "../icon";
import styles from "./toolbar.module.css";

type ToolbarProps = {
	onClose: () => void;
	tools?: ReactNode;
};

export const Toolbar = ({ onClose, tools }: ToolbarProps) => (
	<div className={styles.toolbar}>
		<Button onClick={onClose}>
			<Icon name="x-mark" />
		</Button>
		{tools && <div className={styles.tools}>{tools}</div>}
	</div>
);
