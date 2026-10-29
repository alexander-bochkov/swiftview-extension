import {
	AnchorElementUrlExtractor,
	Detector,
	EventBlocker,
	ImageElementUrlExtractor,
	LongPressRecognizer,
	PageLock,
	ScrollbarHider,
	ViewerHost,
} from "./features";

const HOLD_DELAY = 300;

const extractors = [
	new AnchorElementUrlExtractor(),
	new ImageElementUrlExtractor(),
];

const blocker = new EventBlocker();
const detector = new Detector(extractors);
const viewerHost = new ViewerHost(new PageLock(new ScrollbarHider()));

const recognizer = new LongPressRecognizer(blocker, {
	delay: HOLD_DELAY,
	onLongPress: (point) => {
		const url = detector.detectUrl(point);
		if (url) viewerHost.open(url);
	},
	shouldIgnore: () => viewerHost.isOpen,
});

recognizer.enable();
