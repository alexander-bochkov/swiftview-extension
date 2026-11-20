# Linked media formats

## Formats we could support

Formats Chrome opens, see the test results below, with their extensions and
MIME types. `FORMATS` has only the most common of them. The list is what
`FORMATS` had on 2026-11-19.

### Images

| Extensions                                                 | MIME types                             |
| ---------------------------------------------------------- | -------------------------------------- |
| `apng`                                                     | image/apng                             |
| `avif`, `avifs`                                            | image/avif                             |
| `bmp`                                                      | image/bmp                              |
| `cur`, `ico`                                               | image/vnd.microsoft.icon, image/x-icon |
| `gif`                                                      | image/gif                              |
| `jfif`, `jpe`, `jpeg`, `jpg`, `jps`, `mpo`, `pjp`, `pjpeg` | image/jpeg                             |
| `jxl`                                                      | image/jxl                              |
| `png`                                                      | image/png                              |
| `svg`                                                      | image/svg+xml                          |
| `webp`                                                     | image/webp                             |

### Videos

| Extensions | MIME types                                           |
| ---------- | ---------------------------------------------------- |
| `3g2`      | video/3gpp2                                          |
| `3gp`      | video/3gpp                                           |
| `m3u8`     | application/vnd.apple.mpegurl, application/x-mpegurl |
| `m4v`      | video/x-m4v                                          |
| `mkv`      | video/x-matroska                                     |
| `mov`      | video/quicktime                                      |
| `mp4`      | video/mp4                                            |
| `ogv`      | video/ogg                                            |
| `webm`     | video/webm                                           |

## How they were tested

Tested on 2026-11-19 in Chrome 158.0.8127.37 on Windows 11, with every file in
<https://dl.photoprism.app/samples/Formats/> (744 files). Each file was loaded
both as an `<img>` (`decode()`) and as a muted `<video>`. For the video test,
we noted whether metadata loads, the video size, whether frames render and
whether playback time advances.

Rules for the list:

- A video extension goes in if Chrome plays at least some files with it.
- A file that plays only its audio is still shown as a video.
- Formats that only Firefox or Safari support stay out. The extension is
  Chrome-only, and a link Chrome can't open costs a request and a delay before
  the probe falls back.

## Added after the test

Before the test, the list had `avif`, `bmp`, `gif`, `jpeg`, `jpg`, `png`,
`svg`, `webp`, `m4v`, `mov`, `mp4` and `webm`. Added on 2026-11-19:

- **Images:** `apng`, `avifs`, `cur`, `ico`, `jfif`, `jpe`, `jps`, `jxl`,
  `mpo`, `pjp`, `pjpeg`
- **Videos:** `3g2`, `3gp`, `m3u8`, `mkv`, `ogv`. `ogv` is back after it was
  dropped in 4fe609f, because VP8 in Ogg plays.
- **MIME types for data URLs:**
  - images: image/apng, image/jxl, image/vnd.microsoft.icon, image/x-icon
  - videos: application/vnd.apple.mpegurl, application/x-mpegurl, video/3gpp,
    video/3gpp2, video/ogg, video/x-matroska

`3g2`, `cur`, `ico`, `jfif`, `jpe`, `pjp` and `pjpeg` had no sample files, so
they weren't tested. They went in because Chrome decodes their formats.

## Test results: images

| Extension                     | MIME type                              | Result                                                         |
| ----------------------------- | -------------------------------------- | -------------------------------------------------------------- |
| `apng`                        | image/apng                             | 4/4                                                            |
| `avif`                        | image/avif                             | 5/5                                                            |
| `avifs`                       | image/avif                             | 2/4. The two with alpha fail as `<img>` but open in `<video>`. |
| `bmp`                         | image/bmp                              | 5/5                                                            |
| `cur`, `ico`                  | image/vnd.microsoft.icon, image/x-icon | Not tested, no samples                                         |
| `gif`                         | image/gif                              | 22/22                                                          |
| `jfif`, `jpe`, `pjp`, `pjpeg` | image/jpeg                             | Not tested, no samples. JPEG under other names.                |
| `jpeg`, `jpg`                 | image/jpeg                             | 37/37                                                          |
| `jps`, `mpo`                  | image/jpeg                             | 1/1 each. Stereo JPEG, shown as a plain JPEG.                  |
| `jxl`                         | image/jxl                              | 15/15, including animated. On by default in Chrome 158.        |
| `png`                         | image/png                              | 16/16                                                          |
| `svg`                         | image/svg+xml                          | 7/7                                                            |
| `webp`                        | image/webp                             | 23/23                                                          |

## Test results: videos

Result columns:

- **Video:** frames render.
- **Audio only:** time advances, but there's no picture.
- **No playback:** metadata loads, but playback doesn't start.
- **Fails:** an error, or no metadata.

| Extension | MIME type                                            | Video | Audio only | No playback | Fails | Notes                                                                             |
| --------- | ---------------------------------------------------- | ----- | ---------- | ----------- | ----- | --------------------------------------------------------------------------------- |
| `3g2`     | video/3gpp2                                          |       |            |             |       | Not tested, no samples                                                            |
| `3gp`     | video/3gpp                                           | 1     | 0          | 0           | 1     | H.264 + AAC plays; MPEG-4 Part 2 + AMR fails                                      |
| `m3u8`    | application/vnd.apple.mpegurl, application/x-mpegurl | 5     | 0          | 0           | 1     | Chrome plays HLS natively; the failing playlist points to a missing segment       |
| `m4v`     | video/x-m4v                                          | 6     | 0          | 1           | 0     | `drm.m4v` is encrypted                                                            |
| `mkv`     | video/x-matroska                                     | 5     | 3          | 0           | 1     | MagicYUV fails                                                                    |
| `mov`     | video/quicktime                                      | 8     | 2          | 0           | 2     | PCM-only files play audio; Sorenson and MagicYUV fail                             |
| `mp4`     | video/mp4                                            | 81    | 22         | 21          | 16    |                                                                                   |
| `ogv`     | video/ogg                                            | 4     | 4          | 0           | 5     | VP8 plays; Theora was removed from Chrome, so those files play audio only or fail |
| `webm`    | video/webm                                           | 63    | 8          | 20          | 4     |                                                                                   |

The usual reasons:

- **No playback:** DRM-encrypted test files (`enc`, `cenc`, `cbcs` in the
  name) and bare HLS fragments or init segments.
- **Audio only:** the file has no video track, or Chrome can't decode it:
  Theora, or HEVC 4:2:2, 4:4:4 and 12-bit.
- **Fails:**
  - H.266/VVC
  - files with only AC-4, AC-3, E-AC-3 or DTS audio
  - HEVC 4:2:2 or 4:4:4 without audio
  - samples broken on purpose

## Left out

### Images

| Extension                                                                                  | Why                                                                                |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `heic`, `heif`                                                                             | Fail as `<img>`. `<video>` shows only one 512 px tile of the photo.                |
| `svgz`                                                                                     | Works only when served with `Content-Encoding: gzip`. The sample isn't, and fails. |
| `mjpeg`                                                                                    | `<img>` shows only the first frame.                                                |
| `jp2`, `jpf`, `tif`, `tiff`, `psd`, `psb`, `tga`, `exr`, `pbm`, `pcx`, `pfm`, `pxr`, `sct` | Fail                                                                               |
| Raw: `arw`, `cr2`, `cr3`, `crw`, `dng`, `gpr`, `nef`, `raf`, `rw2`                         | Fail                                                                               |
| `ai`, `ait`, `eps`, `ps`, `pdf`                                                            | Fail                                                                               |

### Videos

| Extension                                                              | Why                                                                 |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `ts`, `m2ts`                                                           | Fail on their own; TS segments play only through an `m3u8` playlist |
| `avi`                                                                  | 1/8, audio only                                                     |
| `flv`, `mpeg`, `mpg`, `dv`, `swf`                                      | Fail                                                                |
| `h261`, `h263`, `h264`, `hevc`, `ivf`, `vp8`, `vp9`, `vvc`, AVS3 `bin` | Raw streams without a container; fail                               |

### Audio

SwiftView doesn't support audio. These play as audio only in `<video>`:

| Extension           | Result |
| ------------------- | ------ |
| `aac`               | 4/4    |
| `flac`              | 2/3    |
| `m4a`               | 2/3    |
| `mp3`               | 10/11  |
| `ogg`               | 9/9    |
| `wav`               | 14/16  |
| `ac3`, `ac4`, `mp2` | Fail   |
