import {
	AnchorElementUrlExtractor,
	Detector,
	ImageElementUrlExtractor,
	LongPressRecognizer,
} from "./features";

const HOLD_DELAY = 300;

const detector = new Detector([
	new AnchorElementUrlExtractor(),
	new ImageElementUrlExtractor(),
]);

const recognizer = new LongPressRecognizer({
	delay: HOLD_DELAY,
	onLongPress: (x, y) => {
		const url = detector.detectUrl(x, y);
		if (url) console.log(url);
	},
	shouldIgnore: () => false,
});

recognizer.enable();
