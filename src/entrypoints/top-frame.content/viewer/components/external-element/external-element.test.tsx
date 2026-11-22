import { render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { ExternalElement } from "./external-element";

describe("ExternalElement", () => {
	const createElement = (id: string) => {
		const element = document.createElement("img");
		element.id = id;

		return element;
	};

	it("shows the element", () => {
		const element = createElement("photo");

		const { container } = render(<ExternalElement element={element} />);

		expect(container.querySelector("#photo")).toBe(element);
	});

	it("passes the other props to the wrapper", () => {
		const { container } = render(
			<ExternalElement className="wrapper" element={createElement("photo")} />,
		);

		expect(container.querySelector(".wrapper > #photo")).not.toBeNull();
	});

	it("gives the wrapper to the ref", () => {
		const ref = createRef<HTMLDivElement>();
		const element = createElement("photo");

		render(<ExternalElement element={element} ref={ref} />);

		expect(ref.current).toBe(element.parentElement);
	});

	it("replaces the element with the next one", () => {
		const first = createElement("first");
		const second = createElement("second");

		const { container, rerender } = render(<ExternalElement element={first} />);
		rerender(<ExternalElement element={second} />);

		expect(container.querySelector("#first")).toBeNull();
		expect(container.querySelector("#second")).toBe(second);
	});

	it("keeps the element in place on a rerender with the same one", () => {
		const element = createElement("photo");

		const { rerender } = render(<ExternalElement element={element} />);
		const parent = element.parentElement;
		rerender(<ExternalElement className="wrapper" element={element} />);

		expect(element.parentElement).toBe(parent);
	});

	it("removes the element on unmount", () => {
		const element = createElement("photo");

		const { unmount } = render(<ExternalElement element={element} />);
		unmount();

		expect(element.isConnected).toBe(false);
	});
});
