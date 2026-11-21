// While an element is in fullscreen, Escape exits the fullscreen instead of
// closing the viewer.
export const exitElementFullscreen = async (): Promise<void> => {
	if (document.fullscreenElement) await document.exitFullscreen();
};
