import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Toolbar } from "./toolbar";

// The buttons contain only an icon, so render its name to make them queryable.
vi.mock("../icon", async (importOriginal) => ({
	...(await importOriginal<typeof import("../icon")>()),
	Icon: ({ name }: { name: string }) => name,
}));

describe("Toolbar", () => {
	const onClose = vi.fn();

	// Vitest globals are off, so Testing Library can't register this itself.
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	const getButtonNames = () =>
		screen.getAllByRole("button").map((button) => button.textContent);

	it("closes on the close button", async () => {
		const user = userEvent.setup();
		render(<Toolbar onClose={onClose} />);

		await user.click(screen.getByRole("button", { name: "x-mark" }));

		expect(onClose).toHaveBeenCalledOnce();
	});

	it("shows the tools after the close button", () => {
		render(
			<Toolbar onClose={onClose} tools={<button type="button">tool</button>} />,
		);

		expect(getButtonNames()).toEqual(["x-mark", "tool"]);
	});

	it("shows only the close button without tools", () => {
		render(<Toolbar onClose={onClose} />);

		expect(getButtonNames()).toEqual(["x-mark"]);
	});
});
