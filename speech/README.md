# draco-speech-gen

English | 中文

A DeepSeek Harness **bundle** that adds `speech_generate` through Volcengine Doubao TTS and Seed-Audio 1.0. It is independent of SuperGrok (`draco-grok-oauth`) and Codex (`draco-codex-oauth`). Install only the plugins you want.

## Install

You need a working `dsh` CLI (the official DeepSeek Harness release).

```sh
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:speech
```

This repository ships **built** `lib/` artifacts, so no `prepare` script runs.

Day-to-day iteration uses this floating spec. After a new `main` lands, refresh with:

```sh
dsh plugin --profile web update draco-speech-gen
```

Pin a commit only when you want a frozen install. pnpm takes the commit and the subdirectory as `#<sha>&path:speech` (quote the spec so the shell does not split on `&`):

```sh
dsh plugin --profile web add 'github:dracohu2025-cloud/draco-deepseek-harness-plugin#<sha>&path:speech'
```

`add` of the same floating URL does not refresh the lockfile. `update` does. `remove` then `add` is only for a stuck lockfile or leftover SuperGrok / Codex speech rows.

Then start the official Web profile:

```sh
dsh --profile web
```

Open **Settings → Draco-suite**. If SuperGrok or Codex is also installed, the speech card joins their tab. If this is the only Draco plugin, it mounts the Draco-suite tab itself.

Pick **doubao-tts** (exact wording) or **seed-audio-1.0** (expressive; may add atmosphere). Paste keys on the card, or export them in the environment. **Save and verify** sends a short probe to Volcengine. While it runs, the key fields and Save are hidden and the backend dropdown is disabled. Seed-Audio is a generative model: the check often takes 30 seconds or more (the host waits up to 120s) and retries empty-audio 500s. Doubao TTS usually returns in a few seconds. A green dot on the selected backend hides the fields; a key-icon control beside the dropdown reveals them again. A failure shows the fields with the HTTP error.

| Backend | Credentials |
|---|---|
| `doubao-tts` | `VOLCENGINE_TTS_APP_ID` + `VOLCENGINE_TTS_ACCESS_TOKEN` |
| `seed-audio-1.0` | `SEED_AUDIO_API_KEY` |

`speech_generate` writes an MP3 under `$DSH_HOME/draco/audio/` and plays it in the chat tool row. The clip is stored on the tool result so official `dsh --profile web` can play it without a host `saveAudio`. When the host does have `saveAudio`, the result also carries a durable `AudioBlock`. Speech is never defaulted from OAuth.

If an older SuperGrok or Codex plugin still registered `speech_generate` or a speech Settings card, `update` those bundles (or `remove` then `add` only if their lockfile is stuck). TTS no longer ships inside the image/video bundles.

## What this bundle inserts

| Row | Package export | Role |
|---|---|---|
| `draco-speech-gen` | `draco-speech-gen/speech` | `speech_generate` (Doubao TTS / Seed-Audio 1.0) |
| `draco-speech-gen-ui` | `draco-speech-gen` | Settings → Draco-suite speech card |

## Uninstall

```sh
dsh plugin --profile web remove draco-speech-gen
```

## Develop

Source lives in the Draco fork of DeepSeek Harness (`packages/draco/draco-speech-gen`, `draco-speech-gen-ui`). This directory is the **publish face**: built artifacts plus the bundle patch. Rebuild there, then run `node scripts/sync-from-fork.mjs` from the repository root before tagging a release. Default the install docs to the floating `#path:speech` spec and `dsh plugin update draco-speech-gen`.

`lib/client.js` must register as `draco-speech-gen` (the package name / patch `name`). Do not leave `@deepseek-ai/dsh-draco-speech-gen-ui`.

## License

MIT
