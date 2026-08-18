# Draco DeepSeek Harness plugins

English | 中文

Installable DeepSeek Harness **bundles** for official `dsh` profiles. You do not need the Draco fork or `dsh --profile draco`.

Each plugin is independent. Install only the ones you want.

| Plugin | Install | What you get |
|---|---|---|
| SuperGrok / xAI | `dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin` | SuperGrok OAuth + **Grok 4.6** only (JPEG/PNG, 500k) + **Grok Imagine** Image 2.0 / Video |
| Codex / ChatGPT | `dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:codex` | Codex OAuth + **GPT-5.6 Sol / Terra / Luna** only (1.05M window, `store: false`) + `gpt-image-2` after first login (durable `ImageBlock` + `$DSH_HOME/draco/images/` copy) |

Then start the official Web profile:

```sh
dsh --profile web
```

Open **Settings → Draco-suite**. Each installed plugin contributes a login card there, plus one shared image-generation dropdown.

- SuperGrok: [README](./README.md#supergrok--xai) below
- Codex: [codex/README.md](./codex/README.md)

## SuperGrok / xAI

The repository root package is `draco-grok-oauth`.

```sh
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin
dsh --profile web
```

Open **Settings → Draco-suite**, click **Sign in with SuperGrok**, approve the device-code URL, then pick **Grok 4.6** in the composer. The selector does not offer older Grok 4.x rows.

CLI fallbacks: `/grok-login`, `/grok-status`. Tokens live at `$DSH_HOME/draco/xai-oauth.json` (`0600`).

**Grok 4.6** advertises a **500,000-token** combined context window; an unlisted xAI id resolves to the same default. The Web occupancy ring and stats-line percent appear once a request records that capacity. Cached prompt tokens are published as cache-read (not double-counted as uncached input), so occupancy matches the prompt size xAI compares to the window.

An HTTP 400 that names a maximum prompt length is classified as context overflow, so harness automatic compaction can recover instead of failing the turn. JPEG/PNG images attach as Responses `input_image` data URLs. Idle streams time out after 300s by default (`streamIdleTimeoutMs`); mid-stream transport errors retry.

After SuperGrok login, Settings → Draco-suite shows one **Image generation** dropdown (`Off`, `grok-imagine-image-2.0 (1K/2K)`, and `gpt-image-2-low/medium/high` when the Codex plugin is also installed). The closed control shows the full model id. A SuperGrok-only login defaults an unset backend to Imagine Image 2.0 at 1K. If Codex is also signed in, the backend stays unset until you pick a row here. `image_generate` then calls `POST /v1/images/generations` (`grok-imagine-image-2.0`) and commits a durable `ImageBlock`. `video_generate` calls Imagine Video (`grok-imagine-video`, 1–15s) and writes an MP4 under `$DSH_HOME/draco/videos/`. Both tools reuse the SuperGrok OAuth bearer, or `XAI_API_KEY`.

| Row | Package export | Role |
|---|---|---|
| `draco-grok-oauth` | `draco-grok-oauth/oauth` | Device-code session, token file, `/grok-login` |
| `draco-grok-oauth-ui` | `draco-grok-oauth` | Settings → Draco-suite SuperGrok card |
| `draco-grok-llm-responses` | `draco-grok-oauth/responses` | Grok Responses adapter: 500k window, JPEG/PNG, overflow 400s, disjoint cache usage |
| `draco-grok-imagine` | `draco-grok-oauth/imagine` | `image_generate` + `video_generate` via Grok Imagine Image 2.0 / Video after SuperGrok login |

Optional API-key route: set `XAI_API_KEY` and select **xAI (API key)**.

```sh
dsh plugin --profile web remove draco-grok-oauth
```

## Codex / ChatGPT

The subdirectory package is `draco-codex-oauth`. See [codex/README.md](./codex/README.md).

Codex chat and image-generation requests send `store: false`. The ChatGPT Codex backend refuses to persist Responses and returns HTTP 400 `Store must be set to false` without that field. SuperGrok / xAI routes do not send it. A successful `image_generate` commits the PNG as a durable session `ImageBlock` (plus a convenience copy under `$DSH_HOME/draco/images/`).

```sh
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:codex
dsh plugin --profile web remove draco-codex-oauth
```

## Develop

Source lives in the Draco fork of DeepSeek Harness (`packages/draco/…`). This repository is the **publish face**: built artifacts plus bundle patches. After a user-visible plugin change: rebuild in the fork, run `node scripts/sync-from-fork.mjs`, update this README (and `codex/README.md` when the Codex layer changes), then commit and push `main`.

When rewriting a client bundle, `__ModuleLoader__.load({ id })` must be the **npm package name** (`draco-grok-oauth`, `draco-codex-oauth`), not the workspace package or the cordis row id. The web host looks up the bundle by `cordis.patch.yml` `name`. A mismatch boots the host and then fails in the browser as `plugin "…" is not registered`.

Install problems (GitHub 429, `link:` local install, pnpm store mismatch): see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

## License

MIT
