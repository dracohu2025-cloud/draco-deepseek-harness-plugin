# Agent instructions

This repository publishes installable DeepSeek Harness plugin bundles. Humans and coding agents should treat [README.md](./README.md) as the only getting-started path.

## Do

- Install into the **official** Web profile: `dsh plugin --profile web add github:…#path:<layer>` then `dsh --profile web`. The five layers are `grok`, `codex`, `speech`, `seedance`, `x-search`.
- Follow README.md from the top (English or 中文). Copy the five `add` commands unless the human asked for a subset.
- After `add` or `update`, restart `dsh`. Plugins load only on boot.
- Send the human to **Settings → Draco-suite** for OAuth and **Save and verify**. You cannot complete device-code login in their browser.
- Upgrade with `dsh plugin --profile web update <package>` (`draco-grok-oauth`, `draco-codex-oauth`, `draco-speech-gen`, `draco-seedance-gen`, `draco-x-search`).
- If SuperGrok is still installed from the old root spec (no `#path:grok`), one-time `remove` then `add` with `#path:grok`.

## Do not

- Do not clone this repo or the Draco harness fork to “install” the plugins.
- Do not run `dsh --profile draco`.
- Do not omit `#path:` (including SuperGrok). `github:…/draco-deepseek-harness-plugin` with no path is not a package.
- Do not `remove` then `add` for a normal upgrade (the SuperGrok path migration above is the exception).
- Do not treat `x_search` as a `web_search` engine.
- Do not look for MiniMax Music 3 (`#path:music` is withdrawn).

Package names, credentials, composer models, reasoning rows, and example chat prompts are in README.md.
