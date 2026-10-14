import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Toolbar } from "./toolbar";

// The buttons contain only an icon, so render its name to make them queryable.
vi.mock("../../../components", async (importOriginal) => ({
	...(await importOriginal<typeof import("../../../components")>()),
	Icon: ({ name }: { name: string }) => name,
}));

describe("Toolbar", () => {
	const onClose = vi.fn();
	const onFlip = vi.fn();
	const onRotate = vi.fn();

	// Vitest globals are off, so Testing Library can't register this itself.
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	const clickButton = async (name: string) => {
		const user = userEvent.setup();
		render(<Toolbar onClose={onClose} onFlip={onFlip} onRotate={onRotate} />);

		await user.click(screen.getByRole("button", { name }));
	};

	it("closes on the close button", async () => {
		await clickButton("x-mark");

		expect(onClose).toHaveBeenCalledOnce();
	});

	it.each([
		["rotate-right", "right"],
		["rotate-left", "left"],
	])("rotates on the %s button", async (name, direction) => {
		await clickButton(name);

		expect(onRotate).toHaveBeenCalledExactlyOnceWith(direction);
	});

	it.each([
		["flip-horizontal", "horizontal"],
		["flip-vertical", "vertical"],
	])("flips on the %s button", async (name, direction) => {
		await clickButton(name);

		expect(onFlip).toHaveBeenCalledExactlyOnceWith(direction);
	});
});
