import { Button, Icon } from "../../../components";
import type { FlipDirection, RotateDirection } from "../types";
import styles from "./toolbar.module.css";

type ToolbarProps = {
	hideTools?: boolean;
	onClose: () => void;
	onFlip: (direction: FlipDirection) => void;
	onRotate: (direction: RotateDirection) => void;
	scale: number;
};

const formatZoom = (scale: number): string =>
	`${Math.max(1, Math.round(scale * 100))}%`;

export const Toolbar = ({
	hideTools,
	onClose,
	onFlip,
	onRotate,
	scale,
}: ToolbarProps) => (
	<div className={styles.toolbar}>
		<Button onClick={onClose}>
			<Icon name="x-mark" />
		</Button>
		{!hideTools && (
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
				<div className={styles.zoom}>{formatZoom(scale)}</div>
			</div>
		)}
	</div>
);
