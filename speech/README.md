# draco-speech-gen

English | 中文

A DeepSeek Harness **bundle** that adds `speech_generate` through Volcengine Doubao TTS and Seed-Audio 1.0. It is independent of SuperGrok (`draco-grok-oauth`) and Codex (`draco-codex-oauth`). Install only the plugins you want.

## Install

You need a working `dsh` CLI (the official DeepSeek Harness release).

```sh
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:speech
```

This repository ships **built** `lib/` artifacts, so no `prepare` script runs.

Pin a commit if you want a frozen install. pnpm takes the commit and the subdirectory as `#<sha>&path:speech` (quote the spec so the shell does not split on `&`):

```sh
dsh plugin --profile web add 'github:dracohu2025-cloud/draco-deepseek-harness-plugin#<sha>&path:speech'
```

Then start the official Web profile:

```sh
dsh --profile web
```

Open **Settings → Draco-suite**. If SuperGrok or Codex is also installed, the speech card joins their tab. If this is the only Draco plugin, it mounts the Draco-suite tab itself.

Pick **doubao-tts** (exact wording) or **seed-audio-1.0** (expressive; may add atmosphere). Paste keys on the card, or export them in the environment. **Save and verify** sends a one-character probe to Volcengine. A green **ready** status hides the fields; a failure keeps them and shows the HTTP error. **Replace keys** reveals the fields again.

| Backend | Credentials |
|---|---|
| `doubao-tts` | `VOLCENGINE_TTS_APP_ID` + `VOLCENGINE_TTS_ACCESS_TOKEN` |
| `seed-audio-1.0` | `SEED_AUDIO_API_KEY` |

`speech_generate` writes an MP3 under `$DSH_HOME/draco/audio/`. There is no audio attachment type yet, so the chat shows the file path rather than an inline player. Speech is never defaulted from OAuth.

If an older SuperGrok or Codex plugin still registered `speech_generate` or a speech Settings card, remove and re-add those plugins as well. TTS no longer ships inside the image/video bundles. Pin the commit if `add` keeps an old lockfile:

```sh
dsh plugin --profile web remove draco-speech-gen
dsh plugin --profile web remove draco-grok-oauth
dsh plugin --profile web remove draco-codex-oauth
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:codex
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:speech
```

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

Source lives in the Draco fork of DeepSeek Harness (`packages/draco/draco-speech-gen`, `draco-speech-gen-ui`). This directory is the **publish face**: built artifacts plus the bundle patch. Rebuild there, then run `node scripts/sync-from-fork.mjs` from the repository root before tagging a release.

`lib/client.js` must register as `draco-speech-gen` (the package name / patch `name`). Do not leave `@deepseek-ai/dsh-draco-speech-gen-ui`.

## License

MIT
