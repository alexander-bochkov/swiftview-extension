import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ElementSlot } from "./element-slot";

describe("ElementSlot", () => {
	// Vitest globals are off, so Testing Library can't register this itself.
	afterEach(cleanup);

	const createElement = (id: string) => {
		const element = document.createElement("img");
		element.id = id;

		return element;
	};

	it("shows the element", () => {
		const element = createElement("photo");

		const { container } = render(<ElementSlot element={element} />);

		expect(container.querySelector("#photo")).toBe(element);
	});

	it("passes the other props to the slot", () => {
		const { container } = render(
			<ElementSlot className="slot" element={createElement("photo")} />,
		);

		expect(container.querySelector(".slot > #photo")).not.toBeNull();
	});

	it("replaces the element with the next one", () => {
		const first = createElement("first");
		const second = createElement("second");

		const { container, rerender } = render(<ElementSlot element={first} />);
		rerender(<ElementSlot element={second} />);

		expect(container.querySelector("#first")).toBeNull();
		expect(container.querySelector("#second")).toBe(second);
	});

	it("keeps the element in place on a rerender with the same one", () => {
		const element = createElement("photo");

		const { rerender } = render(<ElementSlot element={element} />);
		const parent = element.parentElement;
		rerender(<ElementSlot className="slot" element={element} />);

		expect(element.parentElement).toBe(parent);
	});

	it("removes the element on unmount", () => {
		const element = createElement("photo");

		const { unmount } = render(<ElementSlot element={element} />);
		unmount();

		expect(element.isConnected).toBe(false);
	});
});
