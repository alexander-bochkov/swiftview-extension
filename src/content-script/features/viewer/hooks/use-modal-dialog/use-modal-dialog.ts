import { KEY_CODE } from "@shared/constants";
import { type ComponentProps, type RefObject, useEffect, useRef } from "react";

type UseModalDialogOptions = {
	onClose: () => void;
};

type UseModalDialogReturn = Pick<
	ComponentProps<"dialog">,
	"closedby" | "onClick" | "onKeyDown"
> & {
	// Closes the dialog with its transition, then calls `onClose`.
	close: () => void;
	// An object ref, so other hooks can use the dialog as their container.
	ref: RefObject<HTMLDialogElement | null>;
};

export const useModalDialog = ({
	onClose,
}: UseModalDialogOptions): UseModalDialogReturn => {
	const ref = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = ref.current;
		if (dialog && !dialog.open) dialog.showModal();
	}, []);

	const close = (): void => {
		const dialog = ref.current;

		// Not shown, or already closing.
		if (!dialog?.open) return;

		dialog.close();

		// The close starts the transitions, so they can be awaited right away.
		// A cancelled one rejects, so it's settled rather than fulfilled.
		const transitions = dialog.getAnimations().map(({ finished }) => finished);

		void Promise.allSettled(transitions).then(() => {
			// The dialog may have been removed in the meantime, together with
			// whatever `onClose` would close.
			if (dialog.isConnected) onClose();
		});
	};

	return {
		// The dialog is closed through `close` only, never natively.
		close,
		closedby: "none",
		onClick: ({ currentTarget, target }) => {
			if (target === currentTarget) close();
		},
		onKeyDown: ({ code }) => {
			if (code === KEY_CODE.ESCAPE) close();
		},
		ref,
	};
};
