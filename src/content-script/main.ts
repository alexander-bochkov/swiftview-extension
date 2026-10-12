import {
	AnchorElementUrlExtractor,
	Detector,
	EventBlocker,
	ImageElementUrlExtractor,
	LongPressRecognizer,
	ViewerHost,
} from "./features";

const HOLD_DELAY = 300;

const extractors = [
	new AnchorElementUrlExtractor(),
	new ImageElementUrlExtractor(),
];

const blocker = new EventBlocker();
const detector = new Detector(extractors);
const viewerHost = new ViewerHost();

const recognizer = new LongPressRecognizer(blocker, {
	delay: HOLD_DELAY,
	onLongPress: ({ x, y }) => {
		const url = detector.detectUrl(x, y);
		if (url) viewerHost.open(url);
	},
	shouldIgnore: () => viewerHost.isOpen,
});

recognizer.enable();
