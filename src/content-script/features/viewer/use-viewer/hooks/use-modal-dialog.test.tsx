import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useModalDialog } from "./use-modal-dialog";

type TestDialogProps = {
	onClose: () => void;
	open?: boolean;
};

const TestDialog = ({ onClose, open }: TestDialogProps) => {
	const dialog = useModalDialog({ onClose });

	return (
		<dialog open={open} {...dialog}>
			<button type="button">content</button>
		</dialog>
	);
};

describe("useModalDialog", () => {
	const onClose = vi.fn();

	// jsdom doesn't implement showModal, so emulate its effect on `open`.
	const showModal = vi.fn(function (this: HTMLDialogElement) {
		this.open = true;
	});

	beforeEach(() => {
		HTMLDialogElement.prototype.showModal = showModal;
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("opens the dialog as modal on mount", () => {
		render(<TestDialog onClose={onClose} />);

		expect(showModal).toHaveBeenCalledOnce();
		expect(screen.getByRole("dialog")).toBeDefined();
	});

	it("does not call showModal for a dialog that is already open", () => {
		render(<TestDialog onClose={onClose} open />);

		expect(showModal).not.toHaveBeenCalled();
	});

	it("closes on a click on the dialog itself", async () => {
		const user = userEvent.setup();
		render(<TestDialog onClose={onClose} />);

		await user.click(screen.getByRole("dialog"));

		expect(onClose).toHaveBeenCalledOnce();
	});

	it("does not close on a click inside the content", async () => {
		const user = userEvent.setup();
		render(<TestDialog onClose={onClose} />);

		await user.click(screen.getByRole("button", { name: "content" }));

		expect(onClose).not.toHaveBeenCalled();
	});

	it("closes on Escape", async () => {
		const user = userEvent.setup();
		render(<TestDialog onClose={onClose} />);

		screen.getByRole("button", { name: "content" }).focus();
		await user.keyboard("{Escape}");

		expect(onClose).toHaveBeenCalledOnce();
	});

	it("ignores other keys", async () => {
		const user = userEvent.setup();
		render(<TestDialog onClose={onClose} />);

		screen.getByRole("button", { name: "content" }).focus();
		await user.keyboard("a{Enter}");

		expect(onClose).not.toHaveBeenCalled();
	});
});
