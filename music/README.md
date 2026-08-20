# draco-music-gen

English | 中文

A DeepSeek Harness **bundle** that adds `music_generate` through MiniMax Music 3.0 and Music 3.0-free. It is independent of SuperGrok (`draco-grok-oauth`), Codex (`draco-codex-oauth`), and speech (`draco-speech-gen`). Install only the plugins you want.

## Install

You need a working `dsh` CLI (the official DeepSeek Harness release).

```sh
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:music
```

This repository ships **built** `lib/` artifacts, so no `prepare` script runs.

Day-to-day iteration uses this floating spec. After a new `main` lands, refresh with:

```sh
dsh plugin --profile web update draco-music-gen
```

Pin a commit only when you want a frozen install. pnpm takes the commit and the subdirectory as `#<sha>&path:music` (quote the spec so the shell does not split on `&`):

```sh
dsh plugin --profile web add 'github:dracohu2025-cloud/draco-deepseek-harness-plugin#<sha>&path:music'
```

`add` of the same floating URL does not refresh the lockfile. `update` does. `remove` then `add` is only for a stuck lockfile.

Then start the official Web profile:

```sh
dsh --profile web
```

Open **Settings → Draco-suite**. If SuperGrok, Codex, or speech is also installed, the music card joins their tab. If this is the only Draco plugin, it mounts the Draco-suite tab itself.

Pick **music-3.0** (paid/token plan, RPM 120) or **music-3.0-free** (API-key plan, RPM 3). Pick the MiniMax region: China (`api.minimaxi.com`) or Global (`api.minimax.io`). Paste `MINIMAX_API_KEY` on the card, or export it in the environment (China also accepts `MINIMAX_CN_API_KEY`). **Save and verify** sends a short instrumental probe to MiniMax. Music 3 is slow: the check often takes one or two minutes (the host waits up to 180s). While it runs, the key field and Save are hidden and the backend dropdown is disabled. A green dot on the selected backend hides the field; a key-icon control beside the dropdown reveals it again. A failure shows the field with the HTTP error.

| Backend | Credentials |
|---|---|
| `music-3.0` | `MINIMAX_API_KEY` (China also `MINIMAX_CN_API_KEY`) |
| `music-3.0-free` | `MINIMAX_API_KEY` (China also `MINIMAX_CN_API_KEY`) |

`music_generate` writes an MP3 under `$DSH_HOME/draco/music/` and plays it in the chat tool row when the clip is at most 4 MiB. The clip is stored on the tool result so official `dsh --profile web` can play it without a host `saveAudio`. When the host does have `saveAudio`, the result also carries a durable `AudioBlock`. Music is never defaulted from OAuth.

Ask the model for an instrumental (`instrumental=true`), a song with lyrics, or `lyricsOptimizer=true` to have MiniMax write lyrics from the prompt.

## What this bundle inserts

| Row | Package export | Role |
|---|---|---|
| `draco-music-gen` | `draco-music-gen/music` | `music_generate` (Music 3.0 / Music 3.0-free) |
| `draco-music-gen-ui` | `draco-music-gen` | Settings → Draco-suite music card |

## Uninstall

```sh
dsh plugin --profile web remove draco-music-gen
```

## Develop

Source lives in the Draco fork of DeepSeek Harness (`packages/draco/draco-music-gen`, `draco-music-gen-ui`). This directory is the **publish face**: built artifacts plus the bundle patch. Rebuild there, then run `node scripts/sync-from-fork.mjs` from the repository root before tagging a release. Default the install docs to the floating `#path:music` spec and `dsh plugin update draco-music-gen`.

`lib/client.js` must register as `draco-music-gen` (the package name / patch `name`). Do not leave `@deepseek-ai/dsh-draco-music-gen-ui`.

## License

MIT
