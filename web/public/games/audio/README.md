# Catacombs background music

`catacombs.html` loads a single looping ambient track from this directory. Drop
the track here as one (or both) of:

- `catacombs-theme.mp3` — broadest browser support (required)
- `catacombs-theme.ogg` — optional; some browsers prefer it, listed first as a
  fallback source

The `<audio id="bgm" loop>` element in `catacombs.html` references these exact
filenames. If neither file is present the game runs normally — playback simply
fails silently and the mute button still works.

## Preparing the source

The original track(s) live outside the repo (`~/works/catacombs_bgm`). Convert a
chosen loop to web-ready formats, e.g. with ffmpeg:

```sh
# from a source WAV/FLAC/etc. — mono/stereo, normalized, ~128kbps is plenty
ffmpeg -i source.wav -c:a libmp3lame -b:a 128k catacombs-theme.mp3
ffmpeg -i source.wav -c:a libvorbis -q:a 4      catacombs-theme.ogg
```

Keep it small (aim for < ~2 MB) since it ships as a static asset. A clean loop
point matters more than length — the element loops seamlessly.
