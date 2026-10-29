import clsx from "clsx/lite";
import { type ReactNode, type RefObject, useEffect, useRef } from "react";
import { KEY_CODE } from "../../../shared/constants";
import styles from "./overlay.module.css";

type OverlayChildrenProps = {
	onRequestClose: () => void;
};

type OverlayProps = {
	children?: (props: OverlayChildrenProps) => ReactNode;
	className?: string;
	onClose: () => void;
	ref: RefObject<HTMLDialogElement | null>;
};

export const Overlay = ({
	children,
	className,
	onClose,
	ref,
}: OverlayProps) => {
	const isBackdropPressRef = useRef(false);

	useEffect(() => {
		const dialog = ref.current;
		if (dialog && !dialog.open) dialog.showModal();
	}, [ref]);

	const handleRequestClose = (): void => {
		const dialog = ref.current;

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

	return (
		<dialog
			className={clsx(styles.overlay, className)}
			closedby="none"
			onClick={({ currentTarget, target }) => {
				if (target === currentTarget && isBackdropPressRef.current) {
					handleRequestClose();
				}
			}}
			onKeyDown={({ code }) => {
				if (code === KEY_CODE.ESCAPE) handleRequestClose();
			}}
			onPointerDown={({ currentTarget, target }) => {
				isBackdropPressRef.current = target === currentTarget;
			}}
			onPointerUp={({ currentTarget, target }) => {
				isBackdropPressRef.current &&= target === currentTarget;
			}}
			ref={ref}
		>
			{children?.({ onRequestClose: handleRequestClose })}
		</dialog>
	);
};
