# Troubleshooting: plugin install failed with `ERR_PNPM_FETCH_429`

English | 中文

记录 2026-08-17 一次插件安装/升级失败的排查与解决过程。

This documents an install/upgrade failure from 2026-08-17 and how it was diagnosed and resolved.

## 现象 | Symptoms

`dsh plugin --profile web update` 和 `dsh plugin --profile web add github:...` 反复失败：

```
[WARN] GET https://codeload.github.com/dracohu2025-cloud/draco-deepseek-harness-plugin/tar.gz/<sha> error (ERR_PNPM_FETCH_429). Will retry ...
[ERR_PNPM_FETCH_429] GET https://codeload.github.com/...: Too Many Requests - 429
dsh: pnpm failed in profile directory /Users/dracohu/.dsh/profiles/web
dsh: git-hosted plugins build on install via their prepare script, which pnpm blocks until allowed — add the exact key pnpm printed above under allowBuilds in ...
```

末尾的 `allowBuilds` 提示是 dsh 的通用兜底文案，与本次故障无关。

The trailing `allowBuilds` hint is dsh's generic fallback message and was unrelated to this failure.

## 排查过程 | Diagnosis

1. **确认 429 仍然生效。** 用 curl 直接请求同一 URL，响应头确认为实时的 429：

   ```
   $ curl -sI https://codeload.github.com/dracohu2025-cloud/draco-deepseek-harness-plugin/tar.gz/<sha>
   HTTP/2 429
   ```

   结论：GitHub codeload 对本机出口 IP 限流，`github:` 协议的 pnpm 安装必须下载 tarball，因此必然失败。这是网络/平台侧问题，不是插件包本身的问题。

   Confirmed with curl that the 429 was live: GitHub codeload was rate-limiting the egress IP, and pnpm's `github:` protocol must download the tarball, so every attempt had to fail. Not a problem with the plugin package itself.

2. **理解 `dsh plugin` 的机制。** 阅读 `apps/cli/src/plugin.ts`（deepseek-harness 仓库）：`dsh plugin` 只是 pnpm 转发器，在 profile 目录（`~/.dsh/profiles/web`）里执行 `pnpm <args>`；绝对路径参数会原样透传（只有 `.`/`..` 相对路径会被重定向到调用目录）。因此可以用本地路径安装，完全绕开 codeload。

   `dsh plugin` is a thin pnpm forwarder running `pnpm <args>` in the profile directory; absolute path specs pass through untouched, so installing from a local checkout bypasses codeload entirely.

3. **发现 pnpm 版本/store 不一致的暗坑。** profile 的 `node_modules` 此前由 pnpm 11.7.0（store v11）安装，但在非交互 shell 中 profile 目录里解析到的 pnpm 是 `~/Library/pnpm/pnpm`（10.28.2 独立版，store v10），会报 `ERR_PNPM_UNEXPECTED_STORE`。deepseek-harness 仓库根的 `packageManager: pnpm@11.7.0` 会在仓库目录内触发版本切换，profile 目录没有该字段，于是回落到旧版本。

   The profile's `node_modules` was installed by pnpm 11.7.0 (store v11), but the standalone pnpm shim resolves to 10.28.2 (store v10) outside the harness repo, producing `ERR_PNPM_UNEXPECTED_STORE`.

## 解决方案 | Resolution

在本地 checkout（内容正好等于目标 commit）上以 link 方式安装，并固定 pnpm 版本：

Install from the local checkout (which was exactly the target commit) as links, with the pnpm version pinned:

```sh
# 固定 pnpm 11.7.0 的 shim（非交互 shell 需要；交互 shell 若已是 11.7.0 可跳过）
mkdir -p /tmp/dsh-pnpm-shim
printf '#!/bin/sh\nexec corepack pnpm@11.7.0 "$@"\n' > /tmp/dsh-pnpm-shim/pnpm
chmod +x /tmp/dsh-pnpm-shim/pnpm

# 以 link: 方式安装（pnpm 会把绝对路径目录装为软链）
dsh plugin --profile web add /path/to/draco-deepseek-harness-plugin
dsh plugin --profile web add /path/to/draco-deepseek-harness-plugin/codex
```

安装后 reconcile 自动把 `draco-grok-oauth`、`draco-codex-oauth` 追加进 profile manifest 的 `dsh.profile.bundles`。

Afterwards, reconciliation appends both packages to `dsh.profile.bundles` in the profile manifest.

## link 模式的后续问题与修复 | Follow-up: `link:` needs local deps

首次 `dsh --profile web` 启动失败：

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'eventsource-parser'
imported from .../draco-deepseek-harness-plugin/lib/responses/index.js
```

原因：`link:` 是软链，Node 从仓库的**真实路径**解析依赖，而本仓库是纯发布仓（只有构建产物 `lib/`），从未执行过 `pnpm install`，没有 `node_modules`。从 GitHub tarball 安装时 pnpm 会把包拷进 profile 的 store 并顺带装好 runtime 依赖，所以此前从未暴露这个问题。

Cause: with `link:`, Node resolves dependencies from the repo's real path, but this publish-only repo (built `lib/` only) had no `node_modules`. Tarball installs copy the package into the profile store and install its runtime dependencies, so this never surfaced before.

修复：在两个包目录内安装 runtime 依赖（关闭 auto-install-peers，避免拉取 `@deepseek-ai/*` peer 包）：

Fix — install runtime dependencies inside both package directories, with auto-install-peers disabled so the `@deepseek-ai/*` peers are not fetched:

```sh
cd /path/to/draco-deepseek-harness-plugin && pnpm install --config.auto-install-peers=false
cd codex && pnpm install --config.auto-install-peers=false
```

之后 `dsh --profile web` 正常启动（`http://127.0.0.1:3080`）。

Afterwards `dsh --profile web` boots normally.

## 启动报错：client bundle 未注册插件 id | Boot failure: bundle loaded without registering

第二次启动失败：

```
Failed to load plugins
failed to import loader entry ... (draco-codex-oauth): client-modules: bundle /plugins/draco-codex-oauth/client.js?rev=...
loaded without registering "draco-codex-oauth" via __ModuleLoader__.load
```

原因：fork 工作区构建出的 `client.js` 以 scoped 包名注册（`__ModuleLoader__.load({ id: "@deepseek-ai/dsh-draco-oauth-codex-ui" })`），而发布仓的 `cordis.patch.yml` 把 UI 行的 `name` 设为发布包名（`draco-codex-oauth`）。host 加载器要求 bundle 注册的 id 与 cordis 行的 `name` 完全一致，不一致即拒绝加载。此前发布靠手工改写，漏改了注册 id / CSS `tagId` / `dataset.plugin` 三处。

Cause: the fork-built `client.js` registers the scoped workspace id (`@deepseek-ai/dsh-draco-oauth-codex-ui`), but the published `cordis.patch.yml` names the UI row after the published package (`draco-codex-oauth`). The host loader rejects any bundle whose registered id differs from the row name. The rewrite used to be manual and missed three spots (registration id, CSS `tagId`, `dataset.plugin`).

修复（已固化）：`scripts/sync-from-fork.mjs` 在从 fork 拷贝构建产物时统一改写 `client.js`、`typert.host.js`、`typert.remote-client.js` 里的 scoped id（先 `-ui` 长 id，再短 id），并在末尾断言 bundle 注册了发布包名。发布流程：

Fix (now codified): `scripts/sync-from-fork.mjs` rewrites the scoped ids in `client.js`, `typert.host.js`, `typert.remote-client.js` while copying build outputs from the fork, and asserts the bundle registers the published name. Publish flow:

```sh
cd ~/REPO/deepseek-harness && npm run build:lib
node ~/REPO/draco-deepseek-harness-plugin/scripts/sync-from-fork.mjs
```

## 运行期修复：Grok 流挂起与 Codex 就绪事件 | Runtime fixes: stalled Grok streams and the Codex ready event

同一轮排查还发现两个运行期问题，均已在 fork 源码修复并随本次同步发布：

Two runtime issues from the same investigation are fixed in the fork sources and ship with this sync:

1. **流式 SSE 异常被归为 UNKNOWN，不重试。** `draco-llm-responses` 的流读 catch 原样抛出 undici 的 `terminated` 等原始错误，host 的重试分类器只认 `HarnessError.code`，于是 6 分钟无数据后 socket 被上游关闭的故障被当作不可重试错误直接失败。修复：流读异常归类为 `TRANSPORT`（在默认重试码列表内），并接入 `@deepseek-ai/dsh-timeout` 的空闲看门狗（默认 300s 无事件即 `TIMEOUT`，可用 `streamIdleTimeoutMs` 配置）。
   Mid-stream failures surfaced as UNKNOWN and were never retried. Stream-read errors are now classified `TRANSPORT`, and an idle watchdog fails silent streams with `TIMEOUT` (default 300s, configurable via `streamIdleTimeoutMs`).

2. **重启后"Codex 已就绪但生图模型未就绪"。** `draco/codex-oauth-ready` 此前只在设备码登录轮询成功时发出；从磁盘恢复的已登录会话从不发该事件，而 `draco-image-gen` 只在收到事件时才把 provider 从 `none` 翻成 `openai-codex`。修复：`draco-oauth-codex` 在加载到磁盘上的有效 token、以及刷新成功时同样发出 ready 事件。
   After a restart, a persisted Codex session never emitted `draco/codex-oauth-ready` (only fresh logins did), so image generation stayed at provider `none`. The plugin now announces readiness when a persisted valid session loads and after a successful refresh.

## 经验总结 | Takeaways

- **GitHub 429 时的备选路线**：本地路径安装完全绕过 codeload，且 `link:` 软链让开发改动（重建 `lib/`）即时生效，无需重装。
  When codeload rate-limits you, local-path install bypasses it entirely, and `link:` makes rebuilds of `lib/` take effect immediately.
- **link 模式下新增 runtime 依赖时**，必须在对应包目录补一次 `pnpm install`。
  With `link:`, adding a runtime dependency requires a `pnpm install` in that package directory.
- **保持 profile 内 pnpm 版本一致**：若在新终端看到 `ERR_PNPM_UNEXPECTED_STORE`，在 `~/.dsh/profiles/web/package.json` 加 `"packageManager": "pnpm@11.7.0"` 固定版本。
  Keep the pnpm version consistent inside the profile; pin `"packageManager"` in the profile manifest if `ERR_PNPM_UNEXPECTED_STORE` appears.
- 限流解除后如需切回线上安装，重新 `dsh plugin --profile web add github:...` 会覆盖 link 依赖。
  To switch back to the GitHub spec after the rate limit clears, re-run `dsh plugin --profile web add github:...`, which replaces the link dependencies.
