# SwiftView

Chrome extension that opens images and videos from the context menu in a viewer over the page, picking a larger version when the page links to one or lists it in srcset.

## Features

- **Open from the context menu.** Any image or video opens in the viewer from its context menu, including those inside iframes and shadow roots.
- **Larger versions.** If the image or video links to a larger image or video, or the image lists a larger one in srcset, the viewer opens it instead (see [Larger versions](#larger-versions) below).
- **Image controls.** Zoom up to 400%, panning, rotation and flipping.
- **Video playback.** Videos play with the browser's own controls and keyboard shortcuts.
- **Video options.** The options page sets whether videos start playing on their own, loop and open muted. Chrome Sync is supported.

## Installation

SwiftView requires Google Chrome 148 or later.

### Chrome Web Store

Install SwiftView from its [Chrome Web Store page](https://chromewebstore.google.com/detail/elnineelkpfahckihmbnlibdpjdlliic).

### Manually

1. Download the zip file from the [latest release](https://github.com/alexander-bochkov/swiftview-extension/releases/latest) and unzip it.
2. Open `chrome://extensions` and turn on "Developer mode".
3. Click "Load unpacked" and select the unzipped folder.

A manually installed copy doesn't update on its own. To update it, replace the contents of the folder with the newer version and click the reload button on the SwiftView card in `chrome://extensions`.

## How to use

- **Open:** right-click an image or a video and choose "Open with SwiftView".
- **Zoom:** scroll the mouse wheel. The image zooms toward the pointer.
- **Fit or 100%:** click the image, or the zoom percentage.
- **Pan:** drag the image.
- **Rotate and flip:** the buttons on the right.
- **Close:** press Esc, click the close button, or click outside the image or video.
- **Options:** open the Extensions menu (the puzzle icon in the toolbar), click ⋮ next to SwiftView and choose "Options".

## Larger versions

SwiftView tries these in order and opens the first one that loads:

1. The file the image or video links to, when it's wrapped in a link to an image or a video in one of these formats. A link to an http, https or file URL is recognized by the extension at the end of its path, and a data URL by its MIME type:

   | Format | Extensions      | MIME type    |
   | ------ | --------------- | ------------ |
   | GIF    | `.gif`          | `image/gif`  |
   | JPEG   | `.jpeg`, `.jpg` | `image/jpeg` |
   | PNG    | `.png`          | `image/png`  |
   | WebP   | `.webp`         | `image/webp` |
   | MP4    | `.mp4`          | `video/mp4`  |
   | WebM   | `.webm`         | `video/webm` |

2. The largest image in the srcset of the image, with width (`800w`) or density (`2x`) descriptors. For an image inside a picture element, the srcset of the source the browser picked for the page.
3. The image or video itself.

## Permissions and privacy

- **Context menus:** to add the SwiftView item to the context menu.
- **Scripting:** to check whether content scripts can run on the current page and to suggest reloading a page that was open before SwiftView was installed or updated.
- **Storage:** to save the options.
- **Tabs:** to detect a page opened from a local file and offer to grant access to file URLs.
- **Access to all sites:** to work on any site and load the images and videos the viewer opens.

SwiftView collects no data and sends nothing anywhere. The only requests it makes are for the opened image or video and for its larger versions that the page links to or lists in srcset. The options are saved in Chrome, and Chrome syncs them through the Google account when sync is on.

## Development

SwiftView is built with [WXT](https://wxt.dev), [React](https://react.dev) and [TypeScript](https://www.typescriptlang.org), and needs [Node.js](https://nodejs.org) 26. After `npm install`:

| Command             | What it does                                                                    |
| ------------------- | ------------------------------------------------------------------------------- |
| `npm run dev`       | Opens Chrome with the extension loaded and reloads it on changes.               |
| `npm run build`     | Checks the types and builds the extension into `.output/chrome-mv3`.            |
| `npm run zip`       | Builds the extension and packs it into a zip file in `.output`.                 |
| `npm test`          | Runs the tests.                                                                 |
| `npm run storybook` | Opens [Storybook](https://storybook.js.org) with the viewer and its components. |

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org). Before each commit, Git hooks check the message and run [Biome](https://biomejs.dev), the type check and the tests related to the change.

## License

[MIT](LICENSE). The Inter font is licensed under the [SIL Open Font License 1.1](public/fonts/OFL.txt).
