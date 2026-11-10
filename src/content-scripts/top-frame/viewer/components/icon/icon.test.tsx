import { cleanup, render } from "@testing-library/react";
import { createRef, type ReactElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Icon, type IconName } from "./icon";

// The source of every icon file, to check what each name renders against.
const sources = Object.entries(
	import.meta.glob<string>("./icons/*.svg", {
		eager: true,
		import: "default",
		query: "?raw",
	}),
).map(([path, source]) => ({
	name: path.replace("./icons/", "").replace(".svg", "") as IconName,
	source,
}));

// The parts of an SVG that tell the icons apart.
const describeSvg = (svg: Element) => ({
	paths: [...svg.querySelectorAll("path")].map((path) =>
		path.getAttribute("d"),
	),
	viewBox: svg.getAttribute("viewBox"),
});

describe("Icon", () => {
	// Vitest globals are off, so Testing Library can't register this itself.
	afterEach(cleanup);

	const renderIcon = (element: ReactElement) => {
		const { container } = render(element);
		return container.querySelector("svg");
	};

	it.each(sources)("renders the $name file", ({ name, source }) => {
		const svg = renderIcon(<Icon name={name} />);
		const file = new DOMParser().parseFromString(source, "image/svg+xml");

		expect(svg).not.toBeNull();
		expect(describeSvg(svg as SVGSVGElement)).toEqual(
			describeSvg(file.documentElement),
		);
	});

	it("hides the icon from assistive technologies", () => {
		const svg = renderIcon(<Icon name="x-mark" />);

		expect(svg?.getAttribute("aria-hidden")).toBe("true");
	});

	it("passes native attributes to the svg", () => {
		const svg = renderIcon(
			<Icon className="custom" height={24} name="x-mark" width={24} />,
		);

		expect(svg?.getAttribute("class")).toBe("custom");
		expect(svg?.getAttribute("height")).toBe("24");
		expect(svg?.getAttribute("width")).toBe("24");
	});

	it("forwards the ref to the svg", () => {
		const ref = createRef<SVGSVGElement>();
		const svg = renderIcon(<Icon name="x-mark" ref={ref} />);

		expect(ref.current).toBe(svg);
	});
});
