import clsx from "clsx/lite";
import type { ButtonHTMLAttributes } from "react";
import styles from "./button.module.css";

export const Button = ({
	className,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement>) => (
	<button {...props} className={clsx(styles.button, className)} type="button" />
);
