# draco-x-search

English | 中文

A DeepSeek Harness **bundle** that adds `x_search` (X / Twitter posts) through xAI's server-side search. It is independent of SuperGrok (`draco-grok-oauth`) and Codex (`draco-codex-oauth`). Install only the plugins you want.

This is **not** a `web_search` engine. Official web search stays DeepSeek / Exa / Perplexity. `x_search` is its own tool, so any chat model (including DeepSeek) can call it.

Full install path (Node, official `dsh`, all plugins, first run): [../README.md](../README.md).

## Install

You need a working official `dsh` CLI (`npm install -g @deepseek-ai/dsh`) and pnpm on `PATH`.

```sh
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:x-search
```

This repository ships **built** `lib/` artifacts, so no `prepare` script runs.

Day-to-day iteration uses this floating spec. After a new `main` lands, refresh with:

```sh
dsh plugin --profile web update draco-x-search
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

Open **Settings → Draco-suite**. If SuperGrok, Codex, speech, or Seedance is also installed, the X Search card joins their tab. If this is the only Draco plugin, it mounts the Draco-suite tab itself.

Pick **grok-x-search** (exact wording). SuperGrok login is enough when `draco-grok-oauth` is installed and signed in. Otherwise paste `XAI_API_KEY`. **Save and verify** lists `GET /v1/models`; it does not search X and it does not run on its own when you open Settings. An empty save uses the SuperGrok bearer. While it runs, the key field and Save are hidden and the dropdown is disabled. A green dot on the selected row hides the field; a key-icon control beside the dropdown reveals it again. A failure shows the field with the HTTP error.

A successful `x_search` posts `https://api.x.ai/v1/responses` with `tools: [{ type: "x_search" }]` and model `grok-4.6` (timeout 180s). The tool result is a short Grok summary plus citeable `x.com` URLs taken only from `url_citation` annotations. Optional arguments: `allowed_x_handles` / `excluded_x_handles` (at most 20, not both), `from_date` / `to_date`, `enable_image_understanding` / `enable_video_understanding`.

In chat you do not type the tool name. Example: `What are people saying on X about Grok 4.6 this week?`

## What this bundle inserts

| Row | Package export | Role |
|---|---|---|
| `draco-x-search` | `draco-x-search/x-search` | `x_search` (SuperGrok OAuth or `XAI_API_KEY`) |
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
