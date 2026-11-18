import { MEDIA_TYPE } from "@/shared/constants";
import type { MediaType } from "@/shared/types";

const { IMAGE, VIDEO } = MEDIA_TYPE;

const FORMATS = [
	// image
	{ extensions: ["avif"], mimeTypes: ["image/avif"], type: IMAGE },
	{ extensions: ["bmp"], mimeTypes: ["image/bmp"], type: IMAGE },
	{ extensions: ["gif"], mimeTypes: ["image/gif"], type: IMAGE },
	{ extensions: ["jpeg", "jpg"], mimeTypes: ["image/jpeg"], type: IMAGE },
	{ extensions: ["png"], mimeTypes: ["image/png"], type: IMAGE },
	{ extensions: ["svg"], mimeTypes: ["image/svg+xml"], type: IMAGE },
	{ extensions: ["webp"], mimeTypes: ["image/webp"], type: IMAGE },
	// video
	{ extensions: ["m4v"], mimeTypes: ["video/x-m4v"], type: VIDEO },
	{ extensions: ["mov"], mimeTypes: ["video/quicktime"], type: VIDEO },
	{ extensions: ["mp4"], mimeTypes: ["video/mp4"], type: VIDEO },
	{ extensions: ["webm"], mimeTypes: ["video/webm"], type: VIDEO },
] as const;

export const TYPE_BY_EXTENSION: ReadonlyMap<string, MediaType> = new Map(
	FORMATS.flatMap(({ extensions, type }) =>
		extensions.map((extension) => [extension, type]),
	),
);

export const TYPE_BY_MIME_TYPE: ReadonlyMap<string, MediaType> = new Map(
	FORMATS.flatMap(({ mimeTypes, type }) =>
		mimeTypes.map((mimeType) => [mimeType, type]),
	),
);
