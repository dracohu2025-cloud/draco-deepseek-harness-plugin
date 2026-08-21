# Troubleshooting

English | 中文

Install and first-run path: [README.md](./README.md). After any `add` / `update` / `remove`, restart `dsh --profile web`. New plugins load only on boot.

## `pnpm: command not found`

`dsh plugin` forwards to pnpm. pnpm must be on `PATH`.

```sh
corepack enable
corepack prepare pnpm@11.7.0 --activate
# or: npm install -g pnpm
```

## `ERR_PNPM_FETCH_429` / GitHub “Too Many Requests”

`github:` specs download a tarball from `codeload.github.com`. HTTP 429 is GitHub rate-limiting that download, not a broken plugin.

Wait and retry, or install from a local clone (bypasses codeload):

```sh
git clone https://github.com/dracohu2025-cloud/draco-deepseek-harness-plugin.git
dsh plugin --profile web add /absolute/path/to/draco-deepseek-harness-plugin/grok
dsh plugin --profile web add /absolute/path/to/draco-deepseek-harness-plugin/codex
```

A `link:` install resolves Node dependencies from the clone. This publish repo has no `node_modules` until you install them in each package directory with `pnpm install --config.auto-install-peers=false`. A GitHub tarball install does that for you.

When the rate limit clears, `dsh plugin --profile web add github:…` replaces the link with the remote spec.

## `ERR_PNPM_UNEXPECTED_STORE`

The Web profile’s `node_modules` was built with a different pnpm store than the `pnpm` now on `PATH` (often pnpm 11 store v11 vs a standalone pnpm 10 store v10).

Pin the profile and retry:

```sh
# add "packageManager": "pnpm@11.7.0" to ~/.dsh/profiles/web/package.json
corepack prepare pnpm@11.7.0 --activate
dsh plugin --profile web update draco-grok-oauth
```

## Settings has no Draco-suite tab

The plugin is not in the running tree. Confirm `dsh plugin --profile web list` shows `draco-grok-oauth` / `draco-codex-oauth` / `draco-speech-gen` / `draco-seedance-gen` / `draco-x-search`, then **restart** `dsh --profile web`.

## Composer has no Grok 4.6 / GPT-5.6 / reasoning row

Finish **Sign in with SuperGrok** or **Sign in with Codex** on Settings → Draco-suite, then restart if the session was open across the login. Grok 4.6 reasoning is Low / Medium / High / Extra high (default High, cannot off). GPT-5.6 is None / Low / Medium / High / Extra high / Max (default Medium). If the row is still missing, `update` `draco-grok-oauth` / `draco-codex-oauth` and restart.

## Image or video shows as JSON on the tool row

An older plugin left the official generic tool row in charge; that row JSON-dumps `ImageBlock` / `VideoBlock`. `update` SuperGrok / Codex / Seedance and restart. Current builds register their own `image_generate` / `video_generate` toolviews.

Speech already plays in the tool row via `speech_generate` presentation metadata.

## `duplicate loader entry id` / `tool "…" is already registered`

Two layers are claiming the same cordis row id or exclusive tool. `update` every Draco plugin you have, or `remove` the leftover (`draco-music-gen` is withdrawn). Do not install the same `#path:` twice under different specs.

## `plugin "…" is not registered`

The client bundle registered a different id than `cordis.patch.yml` `name`. GitHub tarball installs from `main` rewrite this in `scripts/sync-from-fork.mjs`. Re-`update` from GitHub rather than linking a raw fork `lib/client.js`.

## Seed-Audio: probe timed out / `downstream returned empty audio data`

Seed-Audio is generative. The host waits up to 120s and retries empty-audio HTTP 500s. Timeouts are often network; empty-audio 500s are often a bad or wrong key (`SEED_AUDIO_API_KEY` is the Ark key for Seed-Audio, not `VOLCENGINE_TTS_ACCESS_TOKEN`). Doubao TTS uses `VOLCENGINE_TTS_APP_ID` + `VOLCENGINE_TTS_ACCESS_TOKEN` and usually returns in a few seconds.

## X search runs official `web_search` instead

`x_search` is a separate tool. Official `web_search` stays DeepSeek / Exa / Perplexity. Install `#path:x-search` and `#path:grok`, **Sign in with SuperGrok**, then ask for X / Twitter posts. X Search lights a green ready-dot from that login; it does not take `XAI_API_KEY`.

## `dsh: --profile draco`

These bundles install into official `web`. There is no supported `draco` profile in official `dsh`.

## SuperGrok `add github:…/draco-deepseek-harness-plugin` with no `#path:` fails / does not update

SuperGrok lives in `grok/`, like the other four plugins. Install `github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:grok`. The repository root is not an npm package. An older install from the root spec needs a one-time `remove` then `add` with `#path:grok`; after that, `update draco-grok-oauth` works.

---

中文摘要：`dsh plugin` 需要 PATH 上的 pnpm；五个插件都用 `#path:`（SuperGrok 是 `#path:grok`，仓库根不是 npm 包）；`github:` 安装走 GitHub tarball，429 是限流（可改本地路径）；装完必须重启 `dsh --profile web`；没看到 Draco-suite / 模型 / 推理强度 / 图片视频播放器时先 `update` 再重启；不要用 `--profile draco`；Music 3 已撤出。
