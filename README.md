# Draco DeepSeek Harness plugins

English | 中文

Installable DeepSeek Harness **bundles** for official `dsh` profiles. You do not need the Draco fork or `dsh --profile draco`.

Each plugin is independent. Install only the ones you want.

| Plugin | Install | What you get |
|---|---|---|
| SuperGrok / xAI | `dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin` | SuperGrok OAuth + Grok 4.6 Responses (JPEG/PNG input) |
| Codex / ChatGPT | `dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:codex` | Codex OAuth + GPT-5.4 + `gpt-image-2` after first login |

Then start the official Web profile:

```sh
dsh --profile web
```

Open **Settings → Models**. The Hermes-compatible section shows a card for each installed plugin.

- SuperGrok: [README](./README.md#supergrok--xai) below
- Codex: [codex/README.md](./codex/README.md)

## SuperGrok / xAI

The repository root package is `draco-grok-oauth`.

```sh
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin
dsh --profile web
```

Open **Settings → Models**, click **Sign in with SuperGrok**, approve the device-code URL, then pick **xAI Grok OAuth (SuperGrok) → Grok 4.6**.

CLI fallbacks: `/grok-login`, `/grok-status`. Tokens live at `$DSH_HOME/draco/xai-oauth.json` (`0600`).

| Row | Package export | Role |
|---|---|---|
| `draco-grok-oauth` | `draco-grok-oauth/oauth` | Device-code session, token file, `/grok-login` |
| `draco-grok-oauth-ui` | `draco-grok-oauth` | Settings → Models SuperGrok card |
| `draco-grok-llm-responses` | `draco-grok-oauth/responses` | Grok 4.6 Responses adapter, JPEG/PNG input |

Optional API-key route: set `XAI_API_KEY` and select **xAI (API key)**.

```sh
dsh plugin --profile web remove draco-grok-oauth
```

## Codex / ChatGPT

The subdirectory package is `draco-codex-oauth`. See [codex/README.md](./codex/README.md).

```sh
dsh plugin --profile web add github:dracohu2025-cloud/draco-deepseek-harness-plugin#path:codex
dsh plugin --profile web remove draco-codex-oauth
```

## Develop

Source lives in the Draco fork of DeepSeek Harness (`packages/draco/…`). This repository is the **publish face**: built artifacts plus bundle patches. Rebuild there, then copy `lib/` here before tagging a release.

## License

MIT
