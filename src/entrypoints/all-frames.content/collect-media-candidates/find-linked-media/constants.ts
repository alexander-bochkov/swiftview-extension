import { MEDIA_TYPE } from "@/shared/constants";
import type { MediaType } from "@/shared/types";

const { IMAGE, VIDEO } = MEDIA_TYPE;

const FORMATS = [
	// Images.
	{ extensions: ["apng"], mimeTypes: ["image/apng"], type: IMAGE },
	{ extensions: ["avif", "avifs"], mimeTypes: ["image/avif"], type: IMAGE },
	{ extensions: ["bmp"], mimeTypes: ["image/bmp"], type: IMAGE },
	{
		extensions: ["cur", "ico"],
		mimeTypes: ["image/vnd.microsoft.icon", "image/x-icon"],
		type: IMAGE,
	},
	{ extensions: ["gif"], mimeTypes: ["image/gif"], type: IMAGE },
	{
		extensions: ["jfif", "jpe", "jpeg", "jpg", "jps", "mpo", "pjp", "pjpeg"],
		mimeTypes: ["image/jpeg"],
		type: IMAGE,
	},
	{ extensions: ["jxl"], mimeTypes: ["image/jxl"], type: IMAGE },
	{ extensions: ["png"], mimeTypes: ["image/png"], type: IMAGE },
	{ extensions: ["svg"], mimeTypes: ["image/svg+xml"], type: IMAGE },
	{ extensions: ["webp"], mimeTypes: ["image/webp"], type: IMAGE },
	// Videos.
	{ extensions: ["3g2"], mimeTypes: ["video/3gpp2"], type: VIDEO },
	{ extensions: ["3gp"], mimeTypes: ["video/3gpp"], type: VIDEO },
	{
		extensions: ["m3u8"],
		mimeTypes: ["application/vnd.apple.mpegurl", "application/x-mpegurl"],
		type: VIDEO,
	},
	{ extensions: ["m4v"], mimeTypes: ["video/x-m4v"], type: VIDEO },
	{ extensions: ["mkv"], mimeTypes: ["video/x-matroska"], type: VIDEO },
	{ extensions: ["mov"], mimeTypes: ["video/quicktime"], type: VIDEO },
	{ extensions: ["mp4"], mimeTypes: ["video/mp4"], type: VIDEO },
	{ extensions: ["ogv"], mimeTypes: ["video/ogg"], type: VIDEO },
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
