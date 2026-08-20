# Draco DeepSeek Harness plugins

English | 中文

Installable DeepSeek Harness **bundles** for official `dsh` profiles. You do not need the Draco fork or `dsh --profile draco`.

Each plugin is independent. Install only the ones you want.

| Plugin | Install | What you get |
|---|---|---|
| SuperGrok / xAI | `dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin` | SuperGrok OAuth + **Grok 4.6** only (JPEG/PNG, 500k) + **Grok Imagine** Image 2.0 / Video 1.5 |
| Codex / ChatGPT | `dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:codex` | Codex OAuth + **GPT-5.6 Sol / Terra / Luna** only (1.05M window, `store: false`) + `gpt-image-2` after first login (durable `ImageBlock` + `$DSH_HOME/draco/images/` copy) |
| Speech / TTS | `dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:speech` | `speech_generate` via Volcengine `doubao-tts` / `seed-audio-1.0`; the chat tool row plays the MP3 (copy under `$DSH_HOME/draco/audio/`) |
| Seedance 2.0 | `dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:seedance` | `video_generate` via Volcengine Seedance 2.0 / mini / fast (`ARK_API_KEY`); MP4 under `$DSH_HOME/draco/videos/` |

Then start the official Web profile:

```sh
dsh --profile web
```

Open **Settings → Draco-suite**. Each installed plugin contributes its own cards there. Image and video pickers come with SuperGrok / Codex. Speech and Seedance have their own installs; Seedance rows join the shared **Video generation** dropdown.

- SuperGrok: [README](./README.md#supergrok--xai) below
- Codex: [codex/README.md](./codex/README.md)
- Speech: [speech/README.md](./speech/README.md)
- Seedance: [seedance/README.md](./seedance/README.md)

## SuperGrok / xAI

The repository root package is `draco-grok-oauth`.

```sh
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin
dsh plugin --profile web update draco-grok-oauth
dsh --profile web
```

Open **Settings → Draco-suite**, click **Sign in with SuperGrok**, approve the device-code URL, then pick **Grok 4.6** in the composer. The selector does not offer older Grok 4.x rows.

CLI fallbacks: `/grok-login`, `/grok-status`. Tokens live at `$DSH_HOME/draco/xai-oauth.json` (`0600`).

**Grok 4.6** advertises a **500,000-token** combined context window; an unlisted xAI id resolves to the same default. The Web occupancy ring and stats-line percent appear once a request records that capacity. Cached prompt tokens are published as cache-read (not double-counted as uncached input), so occupancy matches the prompt size xAI compares to the window.

An HTTP 400 that names a maximum prompt length is classified as context overflow, so harness automatic compaction can recover instead of failing the turn. JPEG/PNG images attach as Responses `input_image` data URLs. Idle streams time out after 300s by default (`streamIdleTimeoutMs`); mid-stream transport errors retry.

After SuperGrok login, Settings → Draco-suite shows an **Image generation** dropdown (`Off`, `grok-imagine-image-2.0 (1K/2K)`, and `gpt-image-2-low/medium/high` when the Codex plugin is also installed) and a **Video generation** dropdown (`Off`, `grok-imagine-video-1.5`, plus `doubao-seedance-2.0 (1080p)` / `mini` / `fast` when the Seedance plugin is also installed). Closed controls show the full model id. A SuperGrok-only login defaults an unset image backend to Imagine Image 2.0 at 1K and an unset video backend to `grok-imagine-video-1.5`. If Codex is also signed in, the image backend stays unset until you pick a row; video still defaults to Imagine Video 1.5. `image_generate` then calls `POST /v1/images/generations` (`grok-imagine-image-2.0`) and commits a durable `ImageBlock`. `video_generate` uses the selected video backend (`grok-imagine-video-1.5`, 1–15s, or a Seedance 2.0 row), writes an MP4 under `$DSH_HOME/draco/videos/`, and commits a durable `VideoBlock` so the Web tool row can play it. Pass optional `references` (up to 7) for Imagine reference-to-video or Seedance first-frame / style stills: a prior `image_generate` path, a `sha256:` attachment id, an https URL, a data URI, or `latest` for the most recent session image. Imagine tools reuse the SuperGrok OAuth bearer, or `XAI_API_KEY`. Speech and Seedance are separate plugins: [speech/README.md](./speech/README.md), [seedance/README.md](./seedance/README.md).

| Row | Package export | Role |
|---|---|---|
| `draco-grok-oauth` | `draco-grok-oauth/oauth` | Device-code session, token file, `/grok-login` |
| `draco-grok-oauth-ui` | `draco-grok-oauth` | Settings → Draco-suite SuperGrok card |
| `draco-grok-llm-responses` | `draco-grok-oauth/responses` | Grok Responses adapter: 500k window, JPEG/PNG, overflow 400s, disjoint cache usage |
| `draco-grok-imagine` | `draco-grok-oauth/imagine` | `image_generate` + `video_generate` (Imagine Video 1.5, optional `references`) after SuperGrok login |

Optional API-key route: set `XAI_API_KEY` and select **xAI (API key)**.

```sh
dsh plugin --profile web remove draco-grok-oauth
```

## Speech / TTS

The subdirectory package is `draco-speech-gen`. See [speech/README.md](./speech/README.md). A successful `speech_generate` writes an MP3 under `$DSH_HOME/draco/audio/` and plays it in the Web tool row. Seed-Audio **Save and verify** often takes 30 seconds or more (the host waits up to 120s); Doubao TTS usually returns in a few seconds.

```sh
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:speech
dsh plugin --profile web update draco-speech-gen
dsh plugin --profile web remove draco-speech-gen
```

## Seedance 2.0

The subdirectory package is `draco-seedance-gen`. See [seedance/README.md](./seedance/README.md). Pick `doubao-seedance-2.0 (1080p)`, `doubao-seedance-2.0-mini (720p)`, or `doubao-seedance-2.0-fast (720p)`, paste `ARK_API_KEY`, and **Save and verify**. A successful `video_generate` writes an MP4 under `$DSH_HOME/draco/videos/` and plays it in the Web tool row.

```sh
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:seedance
dsh plugin --profile web update draco-seedance-gen
dsh plugin --profile web remove draco-seedance-gen
```

## MiniMax Music 3 (withdrawn)

MiniMax no longer serves hosted Music 3 (`POST /v1/music_generation`). Token Plan does not include it. This repository has no `#path:music` bundle.

If an older install still loads `draco-music-gen`:

```sh
dsh plugin --profile web remove draco-music-gen
```

## Codex / ChatGPT

The subdirectory package is `draco-codex-oauth`. See [codex/README.md](./codex/README.md).

Codex chat and image-generation requests send `store: false`. The ChatGPT Codex backend refuses to persist Responses and returns HTTP 400 `Store must be set to false` without that field. SuperGrok / xAI routes do not send it. A successful `image_generate` commits the PNG as a durable session `ImageBlock` (plus a convenience copy under `$DSH_HOME/draco/images/`).

```sh
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:codex
dsh plugin --profile web update draco-codex-oauth
dsh plugin --profile web remove draco-codex-oauth
```

## Develop

Source lives in the Draco fork of DeepSeek Harness (`packages/draco/…`). This repository is the **publish face**: built artifacts plus bundle patches. After a user-visible plugin change: rebuild in the fork, run `node scripts/sync-from-fork.mjs` (it copies `lib/` and then runs `scripts/verify-plugin-ids.mjs` so SuperGrok, Codex, speech, and Seedance do not share Loader row ids, exclusive tool names, or Settings seat ids; `video_generate` is shared on purpose), update this README (and `codex/README.md`, `speech/README.md`, or `seedance/README.md` when those layers change), then commit and push `main`. A new modality gets its own `#path:` bundle and new ids on first landing; do not park it inside SuperGrok or Codex.

Prefer whatever makes an official `dsh --profile web` install easier for people who did not clone this repo: floating `#path:` specs, `dsh plugin update <package>`, no `remove` then `add` for ordinary upgrades, and pin a commit only when someone needs a freeze.

When rewriting a client bundle, `__ModuleLoader__.load({ id })` must be the **npm package name** (`draco-grok-oauth`, `draco-codex-oauth`, `draco-speech-gen`, `draco-seedance-gen`), not the workspace package or the cordis row id. The web host looks up the bundle by `cordis.patch.yml` `name`. A mismatch boots the host and then fails in the browser as `plugin "…" is not registered`.

Install problems (GitHub 429, `link:` local install, pnpm store mismatch): see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

## License

MIT
