# draco-codex-oauth

English | 中文

A DeepSeek Harness **bundle** that adds OpenAI Codex / ChatGPT OAuth login, **GPT-5.6 Sol / Terra / Luna** on the Responses API (1.05M context window), and `gpt-image-2` image generation after the first successful login. Install it into an official DSH profile. You do not need the Draco fork or the Draco profile. The selector does not offer GPT-5.5 or earlier.

This package is independent of SuperGrok (`draco-grok-oauth` at the repository root). Install only the plugins you want.

## Install

You need a working `dsh` CLI (the official DeepSeek Harness release).

```sh
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:codex
```

This repository ships **built** `lib/` artifacts, so no `prepare` script runs.

Pin a commit if you want a frozen install:

```sh
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#<sha>:path:codex
```

Then start the official Web profile:

```sh
dsh --profile web
```

Open **Settings → Models**. Under the Hermes-compatible section, click **Sign in with Codex**, approve `https://auth.openai.com/codex/device`, then pick **GPT-5.6 Sol**, **Terra**, or **Luna**. After login the selector still asks ChatGPT `/models`, then keeps only those three slugs (each with a 1,050,000-token window). Before login, and when the live listing has none of them, it shows the same three-row fallback. GPT-5.5 and earlier stay hidden.

Chat and image-generation requests send `store: false`. The ChatGPT Codex backend refuses to persist Responses and returns HTTP 400 `Store must be set to false` without that field.

The same section has an **Image generation** card for GPT Image 2 (`Off` / `Low` / `Medium` / `High`). The first successful login defaults an unset backend to medium. An explicit user choice is left alone.

CLI fallbacks: `/codex-login`, `/codex-status`.

## What this bundle inserts

| Row | Package export | Role |
|---|---|---|
| `draco-codex-oauth` | `draco-codex-oauth/oauth` | ChatGPT device-auth session, token file, `/codex-login` |
| `draco-codex-oauth-ui` | `draco-codex-oauth` | Settings → Models Codex card |
| `draco-codex-llm-responses` | `draco-codex-oauth/responses` | GPT-5.6 Sol/Terra/Luna Responses adapter (1.05M window, Cloudflare originator headers, `store: false`) |
| `draco-image-gen` | `draco-codex-oauth/image-gen` | `image_generate` tool; defaults to `gpt-image-2` after first login |

Tokens are stored at `$DSH_HOME/draco/codex-oauth.json` (`0600`). Generated PNGs land under `$DSH_HOME/draco/images/`. This plugin does not read or write `~/.codex/auth.json`.

## Uninstall

```sh
dsh plugin --profile web remove draco-codex-oauth
```

## Develop

Source lives in the Draco fork of DeepSeek Harness (`packages/draco/draco-oauth-codex`, `draco-oauth-codex-ui`, `draco-llm-responses`, `draco-image-gen`). This directory is the **publish face**: built artifacts plus the bundle patch. Rebuild there, then copy `lib/` here before tagging a release.

`lib/client.js` must register as `draco-codex-oauth` (the package name / patch `name`). Do not leave `@deepseek-ai/dsh-draco-oauth-codex-ui` or the row id `draco-codex-oauth-ui`.

## License

MIT
