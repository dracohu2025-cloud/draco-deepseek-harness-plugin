# Draco DeepSeek Harness plugins

Installable DeepSeek Harness **bundles** for the **official** `dsh` Web profile.

You do **not** clone this repository. You do **not** need the Draco fork. You do **not** run `dsh --profile draco`.

[English](#english) · [中文](#中文) · [Troubleshooting](./TROUBLESHOOTING.md)

---

## English

### If you are a coding agent

Install and wire these plugins for the human. Do not invent other package names or profiles.

1. Confirm `node -v` is `v22.19+` on the 22 line, or `v24+`. Node 23 is not supported.
2. Confirm `dsh --version` works. If it does not: `npm install -g @deepseek-ai/dsh` (verified with `0.1.1-rc.1`).
3. Confirm `pnpm --version` works. `dsh plugin` forwards to pnpm. If it does not: `corepack enable` then `corepack prepare pnpm@11.7.0 --activate` (or `npm install -g pnpm`).
4. Run the five `dsh plugin --profile web add …` commands in [Install](#2-install-the-plugins). Skip a line only when the human asked for a subset.
5. If `dsh --profile web` (or `dsh web`) is already running, **stop it and start it again**. New plugins load only on boot.
6. Tell the human to open `http://127.0.0.1:3080` → **Settings → Draco-suite** and finish login / **Save and verify** (see [First run](#4-first-run-settings--draco-suite)). You cannot complete OAuth in their browser.
7. Verify with `dsh plugin --profile web list`. The names to look for are `draco-grok-oauth`, `draco-codex-oauth`, `draco-speech-gen`, `draco-seedance-gen`, `draco-x-search`.
8. After a later `main` lands, run `dsh plugin --profile web update <package>` (never `remove` then `add` for a normal upgrade), then restart `dsh`.

Never use `--profile draco`. Never `git clone` the harness fork to “install” these plugins.

### 1. Prerequisites

| Need | Check | Install |
|---|---|---|
| Node.js `^22.19.0` or `>=24` | `node -v` | [nodejs.org](https://nodejs.org/) |
| Official `dsh` CLI | `dsh --version` | `npm install -g @deepseek-ai/dsh` |
| pnpm on `PATH` | `pnpm --version` | `corepack enable` |

`dsh web` and `dsh --profile web` are the same Web UI (`http://127.0.0.1:3080` by default). Official DeepSeek chat still needs `DEEPSEEK_API_KEY` in the environment or `$DSH_HOME/.env` (`$DSH_HOME` is `~/.dsh` unless you set it). These plugins add Grok, GPT-5.6, image, video, speech, and X search on top of that.

Verified against official `dsh` `0.1.1-rc.1`.

### 2. Install the plugins

Each plugin is independent and lives in its own subdirectory. pnpm’s `#path:` selects that folder — all five commands look the same. Install only the ones you want, or all five:

```sh
# SuperGrok / xAI — Grok 4.6 + Grok Imagine image/video
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:grok

# Codex / ChatGPT — GPT-5.6 Sol / Terra / Luna + gpt-image-2
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:codex

# Speech / TTS — speech_generate (Volcengine Doubao TTS / Seed-Audio)
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:speech

# Seedance 2.0 — extra video_generate backends (Volcengine Ark)
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:seedance

# X Search — x_search on X (Twitter). Not a web_search engine
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:x-search
```

The repository ships built `lib/`. No `prepare` script runs.

`add` of the same GitHub URL does **not** refresh an already-installed copy. Use [Update](#6-update).

If SuperGrok was installed from the old root spec (no `#path:grok`), `update` cannot retarget the URL. One-time:

```sh
dsh plugin --profile web remove draco-grok-oauth
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:grok
```

### 3. Start the Web UI

```sh
dsh --profile web
```

Open the URL it prints (default `http://127.0.0.1:3080`). If `dsh` was already running when you installed, stop that process and start it again.

### 4. First run: Settings → Draco-suite

Every installed plugin puts cards on **Settings → Draco-suite**. A green ready-dot on the selected dropdown row means that backend is verified. A key icon beside the dropdown shows the secret fields again.

| Plugin | What to do | Ready when |
|---|---|---|
| SuperGrok | **Sign in with SuperGrok** and approve the device-code URL. Fallback: paste `XAI_API_KEY` and pick **xAI (API key)**. CLI: `/grok-login`, `/grok-status`. | Composer lists **Grok 4.6**. Tokens: `$DSH_HOME/draco/xai-oauth.json`. |
| Codex | **Sign in with Codex** and approve `https://auth.openai.com/codex/device`. CLI: `/codex-login`, `/codex-status`. | Composer lists **GPT-5.6 Sol / Terra / Luna**. Tokens: `$DSH_HOME/draco/codex-oauth.json`. |
| Image generation | One dropdown: `Off`, `grok-imagine-image-2.0 (1K/2K)`, `gpt-image-2-low/medium/high` (Codex rows appear after Codex login). Closed control shows the full model id. | Selected Imagine / Codex row has a green dot. SuperGrok-only defaults to Imagine 2.0 1K. Codex-only defaults to `gpt-image-2` medium. Both signed in: pick a row yourself. |
| Video generation | One dropdown: `Off`, `grok-imagine-video-1.5`, plus Seedance rows when that plugin is installed. | Selected row has a green dot. SuperGrok login defaults video to Imagine Video 1.5. Seedance still needs **Save and verify**. |
| Speech | Pick **doubao-tts** or **seed-audio-1.0**. Paste keys. **Save and verify**. | Green dot on the selected backend. Seed-Audio often takes 30s+ (host waits up to 120s). Doubao TTS is usually a few seconds. |
| X Search | Pick **grok-x-search**. Empty **Save and verify** reuses SuperGrok login; otherwise paste `XAI_API_KEY`. The check lists xAI models; it does not search X. | Green dot on `grok-x-search`. |

Credentials (paste on the card, or export in the environment):

| Backend | Keys |
|---|---|
| SuperGrok API-key route | `XAI_API_KEY` |
| Doubao TTS | `VOLCENGINE_TTS_APP_ID` + `VOLCENGINE_TTS_ACCESS_TOKEN` |
| Seed-Audio 1.0 | `SEED_AUDIO_API_KEY` (Ark API key for the Seed-Audio endpoint; not the TTS token) |
| Seedance 2.0 | `ARK_API_KEY` (same Ark key used for Volcengine LLMs) |
| X Search | SuperGrok OAuth, or `XAI_API_KEY` |

While **Save and verify** runs, the key fields and Save are hidden and the dropdown is disabled.

### 5. Use them in chat

In the composer, pick **Grok 4.6** or **GPT-5.6 Sol / Terra / Luna**. The same control then shows reasoning intensity (same row official DeepSeek models use):

| Model | Intensities | Default |
|---|---|---|
| Grok 4.6 | Low / Medium / High / Extra high | High. Cannot turn reasoning off. |
| GPT-5.6 Sol / Terra / Luna | None / Low / Medium / High / Extra high / Max | Medium |

Then talk. The model calls the tools. You do not type tool names.

| You want | Tool the model calls | You should see |
|---|---|---|
| A picture | `image_generate` | The PNG on the tool row (not a JSON dump). Copy also under `$DSH_HOME/draco/images/`. |
| A video | `video_generate` | An in-row player + download. MP4 under `$DSH_HOME/draco/videos/`. Duration: Imagine 1–15s; Seedance 4–15s (default 6). Optional `references` (up to 7): prior image path, `sha256:` attachment id, https URL, data URI, or `latest`. |
| Spoken audio | `speech_generate` | An in-row MP3 player. Copy under `$DSH_HOME/draco/audio/`. |
| Posts on X / Twitter | `x_search` | A short Grok summary plus citeable `x.com` URLs. |

Example messages:

- `Draw a red panda in watercolor.`
- `Make a 6-second video of a cat walking across a kitchen.`
- `Turn that last image into a 6-second video.` (uses `references: latest` when a session image exists)
- `Read this paragraph aloud in Chinese.`
- `What are people saying on X about Grok 4.6 this week?`

`x_search` is **not** `web_search`. Official web search stays DeepSeek / Exa / Perplexity. Any chat model, including DeepSeek, can call `x_search` once that plugin is verified.

JPEG/PNG you attach in chat reach Grok 4.6 as Responses `input_image`. Grok 4.6 advertises a 500,000-token window; GPT-5.6 Sol / Terra / Luna advertise 1,050,000. Codex chat and `gpt-image-2` send `store: false` (the ChatGPT Codex backend requires it).

### 6. Update

```sh
dsh plugin --profile web update draco-grok-oauth
dsh plugin --profile web update draco-codex-oauth
dsh plugin --profile web update draco-speech-gen
dsh plugin --profile web update draco-seedance-gen
dsh plugin --profile web update draco-x-search
```

Then restart `dsh --profile web`. Do not `remove` then `add` for a normal upgrade.

Pin a commit only to freeze. Quote the spec so the shell does not split on `&`:

```sh
dsh plugin --profile web add 'github:dracohu2025-cloud/draco-deepseek-harness-plugin#<sha>&path:grok'
dsh plugin --profile web add 'github:dracohu2025-cloud/draco-deepseek-harness-plugin#<sha>&path:codex'
```

### 7. Uninstall

```sh
dsh plugin --profile web remove draco-grok-oauth
dsh plugin --profile web remove draco-codex-oauth
dsh plugin --profile web remove draco-speech-gen
dsh plugin --profile web remove draco-seedance-gen
dsh plugin --profile web remove draco-x-search
```

Then restart `dsh`.

### Per-plugin details

| Plugin | Package | Extra README |
|---|---|---|
| SuperGrok / xAI | `draco-grok-oauth` (`#path:grok`) | [grok/README.md](./grok/README.md) |
| Codex / ChatGPT | `draco-codex-oauth` (`#path:codex`) | [codex/README.md](./codex/README.md) |
| Speech / TTS | `draco-speech-gen` (`#path:speech`) | [speech/README.md](./speech/README.md) |
| Seedance 2.0 | `draco-seedance-gen` (`#path:seedance`) | [seedance/README.md](./seedance/README.md) |
| X Search | `draco-x-search` (`#path:x-search`) | [x-search/README.md](./x-search/README.md) |

SuperGrok rows: `draco-grok-oauth` (device-code session), `draco-grok-oauth-ui` (Settings card), `draco-grok-llm-responses` (Grok 4.6 adapter), `draco-grok-imagine` (`image_generate` + `video_generate` after login).

Image and video share one tool each (`image_generate`, `video_generate`) across SuperGrok / Codex / Seedance. Speech and X Search are exclusive tools (`speech_generate`, `x_search`).

### Not included

MiniMax Music 3 is withdrawn (`POST /v1/music_generation` is no longer served to new users). There is no `#path:music` bundle. If an older install still loads it:

```sh
dsh plugin --profile web remove draco-music-gen
```

### Develop

Source lives in the Draco fork of DeepSeek Harness (`packages/draco/…`). This repository is the **publish face**: built artifacts plus bundle patches. After a user-visible plugin change: rebuild in the fork, run `node scripts/sync-from-fork.mjs` (it copies `lib/` and then runs `scripts/verify-plugin-ids.mjs` so SuperGrok, Codex, speech, Seedance, and X Search do not share Loader row ids, exclusive tool names, or Settings seat ids; `video_generate` is shared on purpose; `x_search` is exclusive to this layer), update this README (and the layer README when that layer changes), then commit and push `main`. A new modality gets its own `#path:` bundle and new ids on first landing; do not park it inside SuperGrok or Codex.

Prefer whatever makes an official `dsh --profile web` install easier for people who did not clone this repo: floating `#path:` specs, `dsh plugin update <package>`, no `remove` then `add` for ordinary upgrades, and pin a commit only when someone needs a freeze.

When rewriting a client bundle, `__ModuleLoader__.load({ id })` must be the **npm package name** (`draco-grok-oauth`, `draco-codex-oauth`, `draco-speech-gen`, `draco-seedance-gen`, `draco-x-search`), not the workspace package or the cordis row id. The web host looks up the bundle by `cordis.patch.yml` `name`. A mismatch boots the host and then fails in the browser as `plugin "…" is not registered`.

Install problems: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## 中文

官方 DeepSeek Harness（`dsh --profile web`）的可安装插件包。

**不要**为了使用插件去 clone 本仓库。**不需要** Draco 的 harness fork。**不要**运行 `dsh --profile draco`。

### 如果你是编程 Agent

替用户把插件装上并接到官方 Web。不要自造包名或 profile。

1. 确认 `node -v` 是 22 线上的 `v22.19+`，或 `v24+`。不支持 Node 23。
2. 确认 `dsh --version` 可用。不行就执行 `npm install -g @deepseek-ai/dsh`（已在 `0.1.1-rc.1` 验证）。
3. 确认 `pnpm --version` 可用。`dsh plugin` 会转发给 pnpm。不行就 `corepack enable`，再 `corepack prepare pnpm@11.7.0 --activate`（或 `npm install -g pnpm`）。
4. 运行下面 [安装插件](#2-安装插件) 里的五条 `add` 命令。只有用户明确只要其中几个时才跳过。
5. 如果 `dsh --profile web`（或 `dsh web`）已经在跑，**先停再开**。新插件只在启动时加载。
6. 让用户打开 `http://127.0.0.1:3080` → **设置 → Draco-suite**，完成登录 / **保存并验证**（见 [首次配置](#4-首次配置设置--draco-suite)）。你无法代用户完成浏览器 OAuth。
7. 用 `dsh plugin --profile web list` 核对包名：`draco-grok-oauth`、`draco-codex-oauth`、`draco-speech-gen`、`draco-seedance-gen`、`draco-x-search`。
8. 之后 `main` 有更新时，执行 `dsh plugin --profile web update <package>`（正常升级不要 `remove` 再 `add`），然后重启 `dsh`。

### 1. 前置条件

| 需要 | 检查 | 安装 |
|---|---|---|
| Node.js `^22.19.0` 或 `>=24` | `node -v` | [nodejs.org](https://nodejs.org/) |
| 官方 `dsh` | `dsh --version` | `npm install -g @deepseek-ai/dsh` |
| PATH 上的 pnpm | `pnpm --version` | `corepack enable` |

`dsh web` 与 `dsh --profile web` 是同一个 Web UI（默认 `http://127.0.0.1:3080`）。官方 DeepSeek 对话仍需要环境变量或 `$DSH_HOME/.env` 里的 `DEEPSEEK_API_KEY`（未设置时 `$DSH_HOME` 为 `~/.dsh`）。这些插件在此之上增加 Grok、GPT-5.6、生图、生视频、语音和 X 搜索。

已在官方 `dsh` `0.1.1-rc.1` 上验证。

### 2. 安装插件

每个插件独立，并且各占一个子目录。pnpm 的 `#path:` 用来选那个目录 — 五条命令写法一致。只装你要的，或五条都跑：

```sh
# SuperGrok / xAI — Grok 4.6 + Grok Imagine 生图/生视频
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:grok

# Codex / ChatGPT — GPT-5.6 Sol / Terra / Luna + gpt-image-2
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:codex

# 语音 / TTS — speech_generate（火山 Doubao TTS / Seed-Audio）
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:speech

# Seedance 2.0 — 额外的 video_generate 后端（火山方舟）
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:seedance

# X 搜索 — x_search（X / Twitter）。不是 web_search 引擎
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:x-search
```

本仓库发布的是编好的 `lib/`，安装时不会跑 `prepare`。

对同一 GitHub URL 再执行一次 `add` **不会**刷新已装版本。要升级请看 [更新](#6-更新)。

如果 SuperGrok 是用旧的仓库根 spec 装的（没有 `#path:grok`），`update` 改不了那个 URL。只需做一次：

```sh
dsh plugin --profile web remove draco-grok-oauth
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:grok
```

### 3. 启动 Web UI

```sh
dsh --profile web
```

打开它打印的地址（默认 `http://127.0.0.1:3080`）。如果安装时 `dsh` 已经在跑，停掉再开。

### 4. 首次配置：设置 → Draco-suite

已安装的插件都会在 **设置 → Draco-suite** 放卡片。下拉里当前选中项右侧的绿灯表示该后端已验证。钥匙图标会重新显示密钥输入框。

| 插件 | 你要做的 | 就绪标志 |
|---|---|---|
| SuperGrok | 点 **Sign in with SuperGrok**，在设备码页面授权。备选：粘贴 `XAI_API_KEY` 并选 **xAI (API key)**。命令：`/grok-login`、`/grok-status`。 | 输入框模型列表出现 **Grok 4.6**。令牌：`$DSH_HOME/draco/xai-oauth.json`。 |
| Codex | 点 **Sign in with Codex**，在 `https://auth.openai.com/codex/device` 授权。命令：`/codex-login`、`/codex-status`。 | 列表出现 **GPT-5.6 Sol / Terra / Luna**。令牌：`$DSH_HOME/draco/codex-oauth.json`。 |
| 生图 | 一个下拉：`Off`、`grok-imagine-image-2.0 (1K/2K)`、`gpt-image-2-low/medium/high`（Codex 登录后才有 GPT 行）。收起时仍显示完整模型 id。 | 选中的 Imagine / Codex 行有绿灯。只登 SuperGrok 时默认 Imagine 2.0 1K。只登 Codex 时默认 `gpt-image-2` medium。两个都登了：自己选一行。 |
| 生视频 | 一个下拉：`Off`、`grok-imagine-video-1.5`，装了 Seedance 还会出现对应行。 | 选中行有绿灯。SuperGrok 登录后视频默认 Imagine Video 1.5。Seedance 仍需 **保存并验证**。 |
| 语音 | 选 **doubao-tts** 或 **seed-audio-1.0**，粘贴密钥，**保存并验证**。 | 选中后端有绿灯。Seed-Audio 探针经常要 30 秒以上（宿主最多等 120 秒）。Doubao TTS 通常几秒。 |
| X 搜索 | 选 **grok-x-search**。空着 **保存并验证** 会复用 SuperGrok 登录；否则粘贴 `XAI_API_KEY`。这次检查只列 xAI 模型，不会真去搜 X。 | `grok-x-search` 上有绿灯。 |

密钥（写在卡片上，或导出到环境变量）：

| 后端 | 密钥 |
|---|---|
| SuperGrok API key 路线 | `XAI_API_KEY` |
| Doubao TTS | `VOLCENGINE_TTS_APP_ID` + `VOLCENGINE_TTS_ACCESS_TOKEN` |
| Seed-Audio 1.0 | `SEED_AUDIO_API_KEY`（Seed-Audio 接口用的方舟 API Key，不是 TTS token） |
| Seedance 2.0 | `ARK_API_KEY`（和火山 LLM 同一把方舟 Key） |
| X 搜索 | SuperGrok OAuth，或 `XAI_API_KEY` |

**保存并验证** 进行时，密钥框和保存按钮会隐藏，下拉禁用。

### 5. 在对话里用

在输入框选 **Grok 4.6** 或 **GPT-5.6 Sol / Terra / Luna**。同一处会再出现推理强度（和官方 DeepSeek 模型同一行）：

| 模型 | 强度 | 默认 |
|---|---|---|
| Grok 4.6 | Low / Medium / High / Extra high | High。不能关掉推理。 |
| GPT-5.6 Sol / Terra / Luna | None / Low / Medium / High / Extra high / Max | Medium |

然后正常说话。模型会自己调工具，你不用输入工具名。

| 你想要 | 模型调用的工具 | 你应该看到 |
|---|---|---|
| 图 | `image_generate` | 工具行里直接出 PNG（不是一坨 JSON）。副本在 `$DSH_HOME/draco/images/`。 |
| 视频 | `video_generate` | 工具行里可播放 + 下载。MP4 在 `$DSH_HOME/draco/videos/`。时长：Imagine 1–15 秒；Seedance 4–15 秒（默认 6）。可选 `references`（最多 7 张）：上一张图路径、`sha256:` 附件 id、https URL、data URI，或 `latest`。 |
| 语音 | `speech_generate` | 工具行里可播放 MP3。副本在 `$DSH_HOME/draco/audio/`。 |
| X / Twitter 帖子 | `x_search` | 一段 Grok 摘要 + 可引用的 `x.com` 链接。 |

可以这样说：

- `画一只水彩风格的小熊猫。`
- `生成一段 6 秒的视频：一只猫走过厨房。`
- `把刚才那张图做成 6 秒视频。`（会话里已有图时会走 `references: latest`）
- `用中文把这段话读出来。`
- `这周 X 上大家怎么评价 Grok 4.6？`

`x_search` **不是** `web_search`。官方网页搜索仍是 DeepSeek / Exa / Perplexity。只要 X Search 已验证，包括 DeepSeek 在内的对话模型都可以调 `x_search`。

对话里附上的 JPEG/PNG 会作为 Responses `input_image` 传给 Grok 4.6。Grok 4.6 窗口是 50 万 token；GPT-5.6 Sol / Terra / Luna 是 105 万。Codex 对话和 `gpt-image-2` 会带 `store: false`（ChatGPT Codex 后端要求如此）。

### 6. 更新

```sh
dsh plugin --profile web update draco-grok-oauth
dsh plugin --profile web update draco-codex-oauth
dsh plugin --profile web update draco-speech-gen
dsh plugin --profile web update draco-seedance-gen
dsh plugin --profile web update draco-x-search
```

然后重启 `dsh --profile web`。正常升级不要 `remove` 再 `add`。

只有需要冻结版本时才 pin commit。带 `&` 的 spec 请加引号：

```sh
dsh plugin --profile web add 'github:dracohu2025-cloud/draco-deepseek-harness-plugin#<sha>&path:grok'
dsh plugin --profile web add 'github:dracohu2025-cloud/draco-deepseek-harness-plugin#<sha>&path:codex'
```

### 7. 卸载

```sh
dsh plugin --profile web remove draco-grok-oauth
dsh plugin --profile web remove draco-codex-oauth
dsh plugin --profile web remove draco-speech-gen
dsh plugin --profile web remove draco-seedance-gen
dsh plugin --profile web remove draco-x-search
```

然后重启 `dsh`。

### 各插件说明

| 插件 | 包名 | 详细 README |
|---|---|---|
| SuperGrok / xAI | `draco-grok-oauth`（`#path:grok`） | [grok/README.md](./grok/README.md) |
| Codex / ChatGPT | `draco-codex-oauth`（`#path:codex`） | [codex/README.md](./codex/README.md) |
| 语音 / TTS | `draco-speech-gen`（`#path:speech`） | [speech/README.md](./speech/README.md) |
| Seedance 2.0 | `draco-seedance-gen`（`#path:seedance`） | [seedance/README.md](./seedance/README.md) |
| X 搜索 | `draco-x-search`（`#path:x-search`） | [x-search/README.md](./x-search/README.md) |

生图、生视频在 SuperGrok / Codex / Seedance 之间共用同一个工具名（`image_generate`、`video_generate`）。语音和 X 搜索是独占工具（`speech_generate`、`x_search`）。

### 不包含

MiniMax Music 3 已撤出（托管 `POST /v1/music_generation` 不再对新用户提供）。没有 `#path:music`。如果旧安装还在加载它：

```sh
dsh plugin --profile web remove draco-music-gen
```

安装失败见 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)。维护者流程见上文 [Develop](#develop)。

## License

MIT
