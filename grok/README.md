# draco-grok-oauth

English | 中文

A DeepSeek Harness **bundle** that adds SuperGrok / xAI OAuth login, **Grok 4.6** on the Responses API (500k context window, JPEG/PNG input), and Grok Imagine image / video after the first successful login. Install it into an official DSH profile. You do not need the Draco fork or the Draco profile. The selector does not offer older Grok 4.x rows.

This package is independent of Codex (`draco-codex-oauth`). Install only the plugins you want.

Full install path (Node, official `dsh`, all plugins, first run): [../README.md](../README.md).

## Install

You need a working official `dsh` CLI (`npm install -g @deepseek-ai/dsh`) and pnpm on `PATH`.

```sh
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:grok
```

This repository ships **built** `lib/` artifacts, so no `prepare` script runs.

Day-to-day iteration uses this floating spec. After a new `main` lands, refresh with:

```sh
dsh plugin --profile web update draco-grok-oauth
```

Pin a commit only when you want a frozen install. pnpm takes the commit and the subdirectory as `#<sha>&path:grok` (quote the spec so the shell does not split on `&`):

```sh
dsh plugin --profile web add 'github:dracohu2025-cloud/draco-deepseek-harness-plugin#<sha>&path:grok'
```

If SuperGrok was installed from the old root spec (`github:…/draco-deepseek-harness-plugin` with no `#path:`), `update` cannot retarget the URL. One-time:

```sh
dsh plugin --profile web remove draco-grok-oauth
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:grok
```

Then **restart** the official Web profile (plugins load only on boot):

```sh
dsh --profile web
```

Open **Settings → Draco-suite**, click **Sign in with SuperGrok**, approve the device-code URL, then pick **Grok 4.6** in the composer. The same control then offers reasoning intensity **Low / Medium / High / Extra high** (default **High**), the same row DeepSeek models use. Grok 4.6 cannot turn reasoning off.

CLI fallbacks: `/grok-login`, `/grok-status`. Tokens live at `$DSH_HOME/draco/xai-oauth.json` (`0600`).

Optional API-key route: set `XAI_API_KEY` and select **xAI (API key)**.

**Grok 4.6** advertises a **500,000-token** combined context window; an unlisted xAI id resolves to the same default. Cached prompt tokens are published as cache-read (not double-counted as uncached input). An HTTP 400 that names a maximum prompt length is classified as context overflow, so harness automatic compaction can recover. JPEG/PNG images attach as Responses `input_image` data URLs. Idle streams time out after 300s by default (`streamIdleTimeoutMs`); mid-stream transport errors retry.

After SuperGrok login, Settings → Draco-suite shows an **Image generation** dropdown (`Off`, `grok-imagine-image-2.0 (1K/2K)`, and `gpt-image-2-low/medium/high` when the Codex plugin is also installed; a selected Imagine or Codex row shows a green ready dot) and a **Video generation** dropdown (`Off`, `grok-imagine-video-1.5` with a green ready dot, plus Seedance rows when that plugin is also installed and verified). Closed controls show the full model id. A SuperGrok-only login defaults an unset image backend to Imagine Image 2.0 at 1K and an unset video backend to `grok-imagine-video-1.5`. If Codex is also signed in, the image backend stays unset until you pick a row; video still defaults to Imagine Video 1.5.

`image_generate` calls `POST /v1/images/generations` (`grok-imagine-image-2.0`) and commits a durable `ImageBlock`. Official `dsh --profile web` shows that picture on the `image_generate` tool row (this plugin registers the toolview). `video_generate` uses the selected video backend (`grok-imagine-video-1.5`, 1–15s, or a Seedance 2.0 row), writes an MP4 under `$DSH_HOME/draco/videos/`, and commits a durable `VideoBlock`. Official `dsh --profile web` plays that MP4 on the `video_generate` tool row (shared toolview with Seedance; the clip is stored on the tool result because official dsh has no `saveVideo`). Pass optional `references` (up to 7) for Imagine reference-to-video or Seedance first-frame / style stills: a prior `image_generate` path, a `sha256:` attachment id, an https URL, a data URI, or `latest`. Imagine tools reuse the SuperGrok OAuth bearer, or `XAI_API_KEY`.

In chat you do not type tool names. Example: `Draw a red panda in watercolor.` / `Make a 6-second video of a cat walking.`

Speech, Seedance, and X Search are separate plugins: [speech/README.md](../speech/README.md), [seedance/README.md](../seedance/README.md), [x-search/README.md](../x-search/README.md). X Search reuses this SuperGrok OAuth bearer only and is not a `web_search` engine.

## What this bundle inserts

| Row | Package export | Role |
|---|---|---|
| `draco-grok-oauth` | `draco-grok-oauth/oauth` | Device-code session, token file, `/grok-login` |
| `draco-grok-oauth-ui` | `draco-grok-oauth` | Settings → Draco-suite SuperGrok card |
| `draco-grok-llm-responses` | `draco-grok-oauth/responses` | Grok Responses adapter: 500k window, JPEG/PNG, overflow 400s, disjoint cache usage |
| `draco-grok-imagine` | `draco-grok-oauth/imagine` | `image_generate` + `video_generate` (Imagine Video 1.5, optional `references`) after SuperGrok login |

## Uninstall

```sh
dsh plugin --profile web remove draco-grok-oauth
```

## Develop

Source lives in the Draco fork of DeepSeek Harness (`packages/draco/draco-oauth-xai`, `draco-oauth-xai-ui`, `draco-llm-responses`, `draco-image-gen`). This directory is the **publish face**: built artifacts plus the bundle patch. Rebuild there, then run `node scripts/sync-from-fork.mjs` from the repository root before tagging a release. Default the install docs to the floating `#path:grok` spec and `dsh plugin update draco-grok-oauth`.

`lib/client.js` must register as `draco-grok-oauth` (the package name / patch `name`). Do not leave `@deepseek-ai/dsh-draco-oauth-xai-ui`.

## License

MIT
