# draco-x-search

English | 中文

A DeepSeek Harness **bundle** that adds `x_search` (X / Twitter posts) through xAI's server-side search. It is independent of SuperGrok (`draco-grok-oauth`) and Codex (`draco-codex-oauth`). Install only the plugins you want.

This is **not** a `web_search` engine. Official web search stays DeepSeek / Exa / Perplexity. `x_search` is its own tool, so any chat model (including DeepSeek) can call it.

Credentials are **SuperGrok OAuth only**. There is no `XAI_API_KEY` field. Sign in with SuperGrok and the grok-x-search row lights a green ready-dot.

Full install path (Node, official `dsh`, all plugins, first run): [../README.md](../README.md).

## Install

You need a working official `dsh` CLI (`npm install -g @deepseek-ai/dsh`) and pnpm on `PATH`.

```sh
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:x-search
```

Also install SuperGrok (`#path:grok`) and **Sign in with SuperGrok**. This repository ships **built** `lib/` artifacts, so no `prepare` script runs.

Day-to-day iteration uses this floating spec. After a new `main` lands, refresh with:

```sh
dsh plugin --profile web update draco-x-search
dsh plugin --profile web update draco-grok-oauth
```

Pin a commit only when you want a frozen install. pnpm takes the commit and the subdirectory as `#<sha>&path:x-search` (quote the spec so the shell does not split on `&`):

```sh
dsh plugin --profile web add 'github:dracohu2025-cloud/draco-deepseek-harness-plugin#<sha>&path:x-search'
```

`add` of the same floating URL does not refresh the lockfile. `update` does. `remove` then `add` is only for a stuck lockfile.

Then **restart** the official Web profile (plugins load only on boot):

```sh
dsh --profile web
```

Open **Settings → Draco-suite**. If SuperGrok is signed in, X Search selects **grok-x-search** and shows a green ready-dot. If SuperGrok is not signed in, the row says to sign in first. There is no Save-and-verify and no API-key box.

A successful `x_search` posts `https://api.x.ai/v1/responses` with `tools: [{ type: "x_search" }]` and model `grok-4.6` (timeout 180s). The tool result is a short Grok summary plus citeable `x.com` URLs taken only from `url_citation` annotations. Optional arguments: `allowed_x_handles` / `excluded_x_handles` (at most 20, not both), `from_date` / `to_date`, `enable_image_understanding` / `enable_video_understanding`.

In chat you do not type the tool name. Example: `What are people saying on X about Grok 4.6 this week?`

## What this bundle inserts

| Row | Package export | Role |
|---|---|---|
| `draco-x-search` | `draco-x-search/x-search` | `x_search` (SuperGrok OAuth) |
| `draco-x-search-ui` | `draco-x-search` | Settings → Draco-suite X Search card |

## Uninstall

```sh
dsh plugin --profile web remove draco-x-search
```

## Develop

Source lives in the Draco fork of DeepSeek Harness (`packages/draco/draco-x-search`, `draco-x-search-ui`). This directory is the **publish face**: built artifacts plus the bundle patch. Rebuild there, then run `node scripts/sync-from-fork.mjs` from the repository root before tagging a release. Default the install docs to the floating `#path:x-search` spec and `dsh plugin update draco-x-search`.

`lib/client.js` must register as `draco-x-search` (the package name / patch `name`). Do not leave `@deepseek-ai/dsh-draco-x-search-ui`.

## License

MIT
