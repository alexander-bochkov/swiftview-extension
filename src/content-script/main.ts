import {
	AnchorElementUrlExtractor,
	Detector,
	ImageElementUrlExtractor,
	LongPressRecognizer,
	ViewerHost,
} from "./features";

const HOLD_DELAY = 300;

const detector = new Detector([
	new AnchorElementUrlExtractor(),
	new ImageElementUrlExtractor(),
]);

const viewerHost = new ViewerHost();

const recognizer = new LongPressRecognizer({
	delay: HOLD_DELAY,
	onLongPress: (x, y) => {
		const url = detector.detectUrl(x, y);
		if (url) viewerHost.open(url);
	},
	shouldIgnore: () => viewerHost.isOpen,
});

recognizer.enable();
