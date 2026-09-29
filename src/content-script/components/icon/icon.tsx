import type { FC, SVGProps } from "react";

const modules = import.meta.glob<FC<SVGProps<SVGSVGElement>>>("./icons/*.svg", {
	eager: true,
	import: "default",
	query: "?react",
});

const icons = Object.fromEntries(
	Object.entries(modules).map(([path, module]) => [
		path.split("/").pop()?.replace(".svg", "") ?? "",
		module,
	]),
);

type IconProps = SVGProps<SVGSVGElement> & {
	name:
		| "flip-horizontal"
		| "flip-vertical"
		| "rotate-left"
		| "rotate-right"
		| "x-mark";
};

export const Icon = ({ name, ...props }: IconProps) => {
	const SVG = icons[name];

	if (!SVG) {
		console.warn(`Icon "${name}" not found`);
		return null;
	}

	return <SVG {...props} />;
};
