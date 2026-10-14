import { KEY_CODE } from "@shared/constants";
import { type KeyboardEvent, type MouseEvent, useEffect, useRef } from "react";

type UseModalDialogOptions = {
	onClose: () => void;
};

export const useModalDialog = ({ onClose }: UseModalDialogOptions) => {
	const ref = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = ref.current;
		if (dialog && !dialog.open) dialog.showModal();
	}, []);

	const handleClick = ({ currentTarget, target }: MouseEvent) => {
		if (target === currentTarget) onClose();
	};

	const handleKeyDown = ({ code }: KeyboardEvent) => {
		if (code === KEY_CODE.ESCAPE) onClose();
	};

	return { onClick: handleClick, onKeyDown: handleKeyDown, ref } as const;
};
