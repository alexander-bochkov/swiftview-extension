type ModifierKeys = Pick<
	KeyboardEvent | MouseEvent,
	"altKey" | "ctrlKey" | "metaKey" | "shiftKey"
>;

export const hasModifierKey = (e: ModifierKeys): boolean =>
	e.altKey || e.ctrlKey || e.metaKey || e.shiftKey;
