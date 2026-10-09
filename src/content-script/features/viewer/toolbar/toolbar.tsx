import { Button, Icon } from "../../../components";
import styles from "./toolbar.module.css";

type ToolbarProps = {
	onClose: () => void;
	onFlip: (direction: "horizontal" | "vertical") => void;
	onRotate: (direction: "left" | "right") => void;
};

export const Toolbar = ({ onClose, onFlip, onRotate }: ToolbarProps) => (
	<div className={styles.toolbar}>
		<Button onClick={onClose}>
			<Icon name="x-mark" />
		</Button>
		<div className={styles.tools}>
			<Button onClick={() => onRotate("right")}>
				<Icon name="rotate-right" />
			</Button>
			<Button onClick={() => onRotate("left")}>
				<Icon name="rotate-left" />
			</Button>
			<Button onClick={() => onFlip("horizontal")}>
				<Icon name="flip-horizontal" />
			</Button>
			<Button onClick={() => onFlip("vertical")}>
				<Icon name="flip-vertical" />
			</Button>
		</div>
	</div>
);
