import type { MediaCandidate } from "@/shared/types";

export type ViewerProps = {
	candidates: MediaCandidate[];
	onClose: () => void;
};
