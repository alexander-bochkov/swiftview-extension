import clsx from "clsx/lite";
import type { ComponentProps } from "react";
import styles from "./overlay.module.css";

export const Overlay = ({ className, ...props }: ComponentProps<"dialog">) => (
	<dialog {...props} className={clsx(styles.overlay, className)} />
);
