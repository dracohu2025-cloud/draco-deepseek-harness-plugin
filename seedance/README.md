# draco-seedance-gen

English | 中文

A DeepSeek Harness **bundle** that adds Volcengine Seedance 2.0 rows to `video_generate`. It is independent of SuperGrok (`draco-grok-oauth`) and Codex (`draco-codex-oauth`). Install only the plugins you want.

Settings → Draco-suite **Video generation** lists three models. The closed dropdown still shows the full id:

- `doubao-seedance-2.0 (1080p)`
- `doubao-seedance-2.0-mini (720p)`
- `doubao-seedance-2.0-fast (720p)`

If SuperGrok is also installed, those rows join the same dropdown as `grok-imagine-video-1.5`. There is one `video_generate` tool.

## Install

You need a working `dsh` CLI (the official DeepSeek Harness release).

```sh
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:seedance
```

This repository ships **built** `lib/` artifacts, so no `prepare` script runs.

Day-to-day iteration uses this floating spec. After a new `main` lands, refresh with:

```sh
dsh plugin --profile web update draco-seedance-gen
```

If SuperGrok is already installed, also refresh it so the shared video dropdown knows the Seedance rows:

```sh
dsh plugin --profile web update draco-grok-oauth
```

Pin a commit only when you want a frozen install. pnpm takes the commit and the subdirectory as `#<sha>&path:seedance` (quote the spec so the shell does not split on `&`):

```sh
dsh plugin --profile web add 'github:dracohu2025-cloud/draco-deepseek-harness-plugin#<sha>&path:seedance'
```

`add` of the same floating URL does not refresh the lockfile. `update` does. `remove` then `add` is only for a stuck lockfile.

Then start the official Web profile:

```sh
dsh --profile web
```

Open **Settings → Draco-suite**. If SuperGrok or Codex is also installed, the video card is already on their tab. If this is the only Draco plugin, it mounts the Draco-suite tab itself.

Pick a Seedance row, paste `ARK_API_KEY` (the same Ark key used for Volcengine LLMs), and **Save and verify**. The check lists Ark tasks (`page_size=1`); it does not generate a video. While it runs, the key field and Save are hidden and the dropdown is disabled. A green dot on the selected model hides the field; a key-icon control beside the dropdown reveals it again. A failure shows the field with the HTTP error.

`video_generate` writes an MP4 under `$DSH_HOME/draco/videos/` and plays it in the chat tool row (durable `VideoBlock` when the host has `saveVideo`). Duration is 4–15 seconds (default 6). Optional `references` (up to 7): the first still is the first frame; later stills are style references. Seedance is never defaulted from OAuth.

China Ark only: `doubao-seedance-2-0-260128`, `doubao-seedance-2-0-mini-260615`, `doubao-seedance-2-0-fast-260128` on `ark.cn-beijing.volces.com`.

## What this bundle inserts

| Row | Package export | Role |
|---|---|---|
| `draco-seedance-gen` | `draco-seedance-gen/seedance` | Seedance backends for `video_generate` |
| `draco-seedance-gen-ui` | `draco-seedance-gen` | Settings → Draco-suite Seedance rows + `ARK_API_KEY` |

## Uninstall

```sh
dsh plugin --profile web remove draco-seedance-gen
```

## Develop

Source lives in the Draco fork of DeepSeek Harness (`packages/draco/draco-seedance-gen`, `draco-seedance-gen-ui`). This directory is the **publish face**: built artifacts plus the bundle patch. Rebuild there, then run `node scripts/sync-from-fork.mjs` from the repository root before tagging a release. Default the install docs to the floating `#path:seedance` spec and `dsh plugin update draco-seedance-gen`.

`lib/client.js` must register as `draco-seedance-gen` (the package name / patch `name`). Do not leave `@deepseek-ai/dsh-draco-seedance-gen-ui`.

## License

MIT
