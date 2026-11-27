import { Button, Icon } from "../../components";
import type { FlipDirection, RotateDirection } from "../types";
import styles from "./image-tools.module.css";

type ImageToolsProps = {
	onFlip: (direction: FlipDirection) => void;
	onRotate: (direction: RotateDirection) => void;
	onToggleZoom: () => void;
	scale: number;
};

const formatter = new Intl.NumberFormat(browser.i18n.getUILanguage(), {
	maximumFractionDigits: 0,
	style: "percent",
});

const formatZoom = (scale: number): string =>
	formatter.format(Math.max(0.01, scale));

// The tools of the image viewer, for the toolbar.
export const ImageTools = ({
	onFlip,
	onRotate,
	onToggleZoom,
	scale,
}: ImageToolsProps) => (
	<>
		<Button
			onClick={() => onRotate("right")}
			title={i18n.t("viewer.toolbar.rotate_right")}
		>
			<Icon name="rotate-right" />
		</Button>
		<Button
			onClick={() => onRotate("left")}
			title={i18n.t("viewer.toolbar.rotate_left")}
		>
			<Icon name="rotate-left" />
		</Button>
		<Button
			onClick={() => onFlip("horizontal")}
			title={i18n.t("viewer.toolbar.flip_horizontal")}
		>
			<Icon name="flip-horizontal" />
		</Button>
		<Button
			onClick={() => onFlip("vertical")}
			title={i18n.t("viewer.toolbar.flip_vertical")}
		>
			<Icon name="flip-vertical" />
		</Button>
		<Button
			className={styles.zoom}
			onClick={onToggleZoom}
			title={i18n.t("viewer.toolbar.toggle_zoom")}
		>
			{formatZoom(scale)}
		</Button>
	</>
);
