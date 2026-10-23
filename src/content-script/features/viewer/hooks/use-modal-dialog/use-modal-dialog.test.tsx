import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useModalDialog } from "./use-modal-dialog";

type TestDialogProps = {
	onClose: () => void;
	open?: boolean;
};

const TestDialog = ({ onClose, open }: TestDialogProps) => {
	const { close, ...dialog } = useModalDialog({ onClose });

	return (
		<dialog open={open} {...dialog}>
			<button type="button">content</button>
			<button onClick={close} type="button">
				close
			</button>
		</dialog>
	);
};

// A transition whose end the test controls.
const createTransition = () => {
	const { promise, reject, resolve } = Promise.withResolvers<Animation>();

	return {
		cancel: () => reject(new DOMException("", "AbortError")),
		end: () => resolve({} as Animation),
		transition: { finished: promise } as Animation,
	};
};

describe("useModalDialog", () => {
	const onClose = vi.fn();

	// jsdom doesn't implement showModal and close, so emulate their effect on
	// `open`.
	const showModal = vi.fn(function (this: HTMLDialogElement) {
		this.open = true;
	});

	const close = vi.fn(function (this: HTMLDialogElement) {
		this.open = false;
	});

	// jsdom doesn't implement animations either: no transitions by default.
	const getAnimations = vi.fn((): Animation[] => []);

	beforeEach(() => {
		HTMLDialogElement.prototype.showModal = showModal;
		HTMLDialogElement.prototype.close = close;
		HTMLDialogElement.prototype.getAnimations = getAnimations;
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	// A closing dialog is excluded from the accessibility tree.
	const clickContent = async (name: string) => {
		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { hidden: true, name }));
	};

	it("opens the dialog as modal on mount", () => {
		render(<TestDialog onClose={onClose} />);

		expect(showModal).toHaveBeenCalledOnce();
	});

	it("does not call showModal for a dialog that is already open", () => {
		render(<TestDialog onClose={onClose} open />);

		expect(showModal).not.toHaveBeenCalled();
	});

	it("disables native closing of the dialog", () => {
		render(<TestDialog onClose={onClose} />);

		expect(screen.getByRole("dialog").getAttribute("closedby")).toBe("none");
	});

	describe("triggers", () => {
		it("closes on a click on the dialog itself", async () => {
			const user = userEvent.setup();
			render(<TestDialog onClose={onClose} />);

			await user.click(screen.getByRole("dialog"));

			await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
		});

		it("does not close on a click inside the content", async () => {
			render(<TestDialog onClose={onClose} />);

			await clickContent("content");

			expect(close).not.toHaveBeenCalled();
			expect(onClose).not.toHaveBeenCalled();
		});

		it("closes on Escape", async () => {
			const user = userEvent.setup();
			render(<TestDialog onClose={onClose} />);

			screen.getByRole("button", { name: "content" }).focus();
			await user.keyboard("{Escape}");

			await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
		});

		it("ignores other keys", async () => {
			const user = userEvent.setup();
			render(<TestDialog onClose={onClose} />);

			screen.getByRole("button", { name: "content" }).focus();
			await user.keyboard("a{Enter}");

			expect(close).not.toHaveBeenCalled();
		});

		it("closes through the returned function", async () => {
			render(<TestDialog onClose={onClose} />);

			await clickContent("close");

			await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
		});
	});

	describe("transition", () => {
		it("closes the dialog natively to start the transition", async () => {
			render(<TestDialog onClose={onClose} />);

			await clickContent("close");

			expect(close).toHaveBeenCalledOnce();
		});

		it("reports the close once the transitions end", async () => {
			const fade = createTransition();
			const move = createTransition();
			getAnimations.mockReturnValue([fade.transition, move.transition]);
			render(<TestDialog onClose={onClose} />);

			await clickContent("close");
			await act(async () => fade.end());

			expect(onClose).not.toHaveBeenCalled();

			await act(async () => move.end());

			expect(onClose).toHaveBeenCalledOnce();
		});

		it("reports the close when a transition is cancelled", async () => {
			const fade = createTransition();
			getAnimations.mockReturnValue([fade.transition]);
			render(<TestDialog onClose={onClose} />);

			await clickContent("close");
			await act(async () => fade.cancel());

			expect(onClose).toHaveBeenCalledOnce();
		});

		it("ignores another close while closing", async () => {
			const fade = createTransition();
			getAnimations.mockReturnValue([fade.transition]);
			render(<TestDialog onClose={onClose} />);

			await clickContent("close");
			await clickContent("close");
			await act(async () => fade.end());

			expect(close).toHaveBeenCalledOnce();
			expect(onClose).toHaveBeenCalledOnce();
		});

		it("does not report a close after the dialog is removed", async () => {
			const fade = createTransition();
			getAnimations.mockReturnValue([fade.transition]);
			const { unmount } = render(<TestDialog onClose={onClose} />);

			await clickContent("close");
			unmount();
			await act(async () => fade.end());

			expect(onClose).not.toHaveBeenCalled();
		});
	});
});
