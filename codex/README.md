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

Day-to-day iteration uses this floating spec. After a new `main` lands, refresh with:

```sh
dsh plugin --profile web update draco-codex-oauth
```

Pin a commit only when you want a frozen install. pnpm takes the commit and the subdirectory as `#<sha>&path:codex` (quote the spec so the shell does not split on `&`):

```sh
dsh plugin --profile web add 'github:dracohu2025-cloud/draco-deepseek-harness-plugin#<sha>&path:codex'
```

Then start the official Web profile:

```sh
dsh --profile web
```

Open **Settings → Draco-suite**, click **Sign in with Codex**, approve `https://auth.openai.com/codex/device`, then pick **GPT-5.6 Sol**, **Terra**, or **Luna** in the composer. After login the selector still asks ChatGPT `/models`, then keeps only those three slugs (each with a 1,050,000-token window). Before login, and when the live listing has none of them, it shows the same three-row fallback. GPT-5.5 and earlier stay hidden.

Chat and image-generation requests send `store: false`. The ChatGPT Codex backend refuses to persist Responses and returns HTTP 400 `Store must be set to false` without that field.

Settings → Draco-suite has one **Image generation** dropdown (`Off`, `gpt-image-2-low/medium/high`, and `grok-imagine-image-2.0 (1K/2K)` when the SuperGrok plugin is also installed). The closed control shows the full model id. A Codex-only login defaults an unset image backend to medium. When SuperGrok is also signed in, the image backend stays unset until you pick a row here. An explicit user choice is left alone.

A successful `image_generate` commits the PNG through the session attachment store and returns a text envelope plus an `ImageBlock`. A DeepSeek Harness Web build that renders tool-result images shows the picture on the tool row. A convenience copy also lands under `$DSH_HOME/draco/images/`. Speech is a separate plugin: [../speech/README.md](../speech/README.md).

CLI fallbacks: `/codex-login`, `/codex-status`.

## What this bundle inserts

| Row | Package export | Role |
|---|---|---|
| `draco-codex-oauth` | `draco-codex-oauth/oauth` | ChatGPT device-auth session, token file, `/codex-login` |
| `draco-codex-oauth-ui` | `draco-codex-oauth` | Settings → Draco-suite Codex card |
| `draco-codex-llm-responses` | `draco-codex-oauth/responses` | GPT-5.6 Sol/Terra/Luna Responses adapter (1.05M window, Cloudflare originator headers, `store: false`) |
| `draco-codex-image-gen` | `draco-codex-oauth/image-gen` | `image_generate` (defaults to `gpt-image-2` after first login) |

Tokens are stored at `$DSH_HOME/draco/codex-oauth.json` (`0600`). Generated images are durable session attachments; a convenience PNG also lands under `$DSH_HOME/draco/images/`. This plugin does not read or write `~/.codex/auth.json`.

## Uninstall

```sh
dsh plugin --profile web remove draco-codex-oauth
```

## Develop

Source lives in the Draco fork of DeepSeek Harness (`packages/draco/draco-oauth-codex`, `draco-oauth-codex-ui`, `draco-llm-responses`, `draco-image-gen`). This directory is the **publish face**: built artifacts plus the bundle patch. Rebuild there, then copy `lib/` here before tagging a release.

`lib/client.js` must register as `draco-codex-oauth` (the package name / patch `name`). Do not leave `@deepseek-ai/dsh-draco-oauth-codex-ui` or the row id `draco-codex-oauth-ui`.

## License

MIT
