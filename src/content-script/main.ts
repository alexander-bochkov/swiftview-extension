import { LongPressRecognizer } from "./features";

const HOLD_DELAY = 300;

const recognizer = new LongPressRecognizer({
	delay: HOLD_DELAY,
	onLongPress: (x: number, y: number) => {
		console.log(document.elementsFromPoint(x, y));
	},
	shouldIgnore: () => false,
});

recognizer.enable();
