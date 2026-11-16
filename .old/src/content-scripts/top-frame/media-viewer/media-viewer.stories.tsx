import { MEDIA_TYPE } from "@shared/constants";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { MediaViewer } from "./media-viewer";

type Metadata = Meta<typeof MediaViewer>;
type Story = StoryObj<Metadata>;

const IMAGE_URL =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='440' height='120' viewBox='0 0 110 30'%3E%3Crect width='110' height='30' fill='%233d7eff'/%3E%3Ccircle cx='15' cy='15' r='9' fill='%23fff'/%3E%3C/svg%3E";

const MISSING_URL = "https://example.invalid/missing.png";

// A public domain clip from the MDN examples.
const VIDEO_URL =
	"https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm";

export default {
	args: {
		onClose: fn(),
	},
	component: MediaViewer,
	title: "MediaViewer",
} satisfies Metadata;

export const Image: Story = {
	args: {
		candidates: [{ type: MEDIA_TYPE.IMAGE, url: IMAGE_URL }],
	},
};

export const Video: Story = {
	args: {
		candidates: [{ type: MEDIA_TYPE.VIDEO, url: VIDEO_URL }],
	},
};

// The first candidate fails, the second one is shown.
export const Fallback: Story = {
	args: {
		candidates: [
			{ type: MEDIA_TYPE.IMAGE, url: MISSING_URL },
			{ type: MEDIA_TYPE.IMAGE, url: IMAGE_URL },
		],
	},
};

export const Failed: Story = {
	args: {
		candidates: [{ type: MEDIA_TYPE.IMAGE, url: MISSING_URL }],
	},
};
