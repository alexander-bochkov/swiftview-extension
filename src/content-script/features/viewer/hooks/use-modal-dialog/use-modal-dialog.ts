import { KEY_CODE } from "@shared/constants";
import { type ComponentProps, useEffect, useRef } from "react";

type UseModalDialogOptions = {
	onClose: () => void;
};

type UseModalDialogReturn = Pick<
	ComponentProps<"dialog">,
	"closedby" | "onClick" | "onKeyDown" | "ref"
>;

export const useModalDialog = ({
	onClose,
}: UseModalDialogOptions): UseModalDialogReturn => {
	const ref = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = ref.current;
		if (dialog && !dialog.open) dialog.showModal();
	}, []);

	return {
		// The dialog is closed through `onClose` only, never natively.
		closedby: "none",
		onClick: ({ currentTarget, target }) => {
			if (target === currentTarget) onClose();
		},
		onKeyDown: ({ code }) => {
			if (code === KEY_CODE.ESCAPE) onClose();
		},
		ref,
	};
};
