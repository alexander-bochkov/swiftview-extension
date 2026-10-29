import type { ComponentProps } from "react";
import FlipHorizontal from "./icons/flip-horizontal.svg?react";
import FlipVertical from "./icons/flip-vertical.svg?react";
import NoSymbol from "./icons/no-symbol.svg?react";
import RotateLeft from "./icons/rotate-left.svg?react";
import RotateRight from "./icons/rotate-right.svg?react";
import Spinner from "./icons/spinner.svg?react";
import XMark from "./icons/x-mark.svg?react";

const ICONS = {
	"flip-horizontal": FlipHorizontal,
	"flip-vertical": FlipVertical,
	"no-symbol": NoSymbol,
	"rotate-left": RotateLeft,
	"rotate-right": RotateRight,
	spinner: Spinner,
	"x-mark": XMark,
};

export type IconName = keyof typeof ICONS;

type IconProps = ComponentProps<"svg"> & {
	name: IconName;
};

export const Icon = ({ name, ...props }: IconProps) => {
	const Svg = ICONS[name];
	return <Svg {...props} />;
};
