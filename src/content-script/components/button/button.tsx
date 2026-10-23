import clsx from "clsx/lite";
import type { ComponentProps } from "react";
import styles from "./button.module.css";

export const Button = ({ className, ...props }: ComponentProps<"button">) => (
	<button {...props} className={clsx(styles.button, className)} />
);
