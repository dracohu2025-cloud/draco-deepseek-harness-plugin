# draco-grok-oauth

English | 中文

A DeepSeek Harness **bundle** that adds SuperGrok / xAI OAuth login and Grok 4.6 on the Responses API, including JPEG/PNG image input. Install it into an official DSH profile. You do not need the Draco fork to use it.

## Install

You need a working `dsh` CLI (the official DeepSeek Harness release, not a source checkout of this plugin).

```sh
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin
```

pnpm ≥10 will refuse the git `prepare`-less install of a prebuilt package without extra permission. This repository ships **built** `lib/` artifacts, so no `prepare` script runs. If `add` still asks you to allow a build, that is for a dependency, not this package.

Pin a commit if you want a frozen install:

```sh
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#<sha>
```

Or install a packed tarball:

```sh
dsh plugin --profile web add ./draco-grok-oauth-0.1.1.tgz
```

Then start the official Web profile:

```sh
dsh --profile web
```

Open **Settings → Models**. Under the Hermes-compatible section, click **Sign in with SuperGrok**, approve the device-code URL, then pick **xAI Grok OAuth (SuperGrok) → Grok 4.6**.

CLI fallbacks still work: `/grok-login`, `/grok-status`.

## What this bundle inserts

| Row | Package export | Role |
|---|---|---|
| `draco-grok-oauth` | `draco-grok-oauth/oauth` | Device-code session, token file, `/grok-login` |
| `draco-grok-oauth-ui` | `draco-grok-oauth` | Settings → Models SuperGrok card |
| `draco-grok-llm-responses` | `draco-grok-oauth/responses` | Grok 4.6 Responses adapter, JPEG/PNG input |

Tokens are stored at `$DSH_HOME/draco/xai-oauth.json` (`0600`). The adapter advertises `text` + `image` and serializes durable JPEG/PNG attachments as Responses `input_image` data URLs. WebP and GIF are rejected.

Optional API-key route: set `XAI_API_KEY` and select **xAI (API key)**.

## Uninstall

```sh
dsh plugin --profile web remove draco-grok-oauth
```

## Develop

Source of this plugin lives in the Draco fork of DeepSeek Harness (`packages/draco/draco-oauth-xai`, `draco-oauth-xai-ui`, `draco-llm-responses`). This repository is the **publish face**: built artifacts plus the bundle patch. Rebuild there, then copy `lib/` here before tagging a release.

## License

MIT
