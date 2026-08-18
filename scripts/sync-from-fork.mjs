#!/usr/bin/env node
/**
 * Sync built draco plugin artifacts from the local deepseek-harness fork into
 * this publish repo.
 *
 * The fork builds browser client bundles and Typert remote manifests with the
 * scoped workspace package ids (`@deepseek-ai/dsh-draco-oauth-codex[-ui]`).
 * The published package registers under its npm name (`draco-codex-oauth` /
 * `draco-grok-oauth`), which is the id the host loader expects
 * `__ModuleLoader__.load` and the remote manifest to use — so the scoped ids
 * are rewritten during the copy.
 *
 * Usage: node scripts/sync-from-fork.mjs [forkRoot]
 *   forkRoot defaults to ~/REPO/deepseek-harness
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const publishRoot = resolve(here, '..')
const forkRoot = resolve(process.argv[2] ?? join(homedir(), 'REPO', 'deepseek-harness'))
const dracoRoot = join(forkRoot, 'packages', 'draco')

/**
 * One publish layer: target directory ('' = repo root), published package
 * name, and the scoped fork ids that must become that name.
 * Order matters: the longer `-ui` id is rewritten first.
 */
const LAYERS = [
  {
    dir: 'codex',
    packageName: 'draco-codex-oauth',
    scopedIds: ['@deepseek-ai/dsh-draco-oauth-codex-ui', '@deepseek-ai/dsh-draco-oauth-codex'],
  },
  {
    dir: '',
    packageName: 'draco-grok-oauth',
    scopedIds: ['@deepseek-ai/dsh-draco-oauth-xai-ui', '@deepseek-ai/dsh-draco-oauth-xai'],
  },
]

/** [forkPackage, forkFile, layerDir, publishFile] — plain copies. */
const COPIES = [
  // codex layer (publishes as draco-codex-oauth under codex/)
  ['draco-oauth-codex-ui', 'lib/index.js', 'codex', 'lib/index.js'],
  ['draco-oauth-codex-ui', 'lib/invariant.js', 'codex', 'lib/invariant.js'],
  ['draco-oauth-codex', 'lib/index.js', 'codex', 'lib/oauth/index.js'],
  ['draco-oauth-codex', 'lib/invariant.js', 'codex', 'lib/oauth/invariant.js'],
  ['draco-oauth-codex', 'lib/types/types.js', 'codex', 'lib/types.js'],
  ['draco-llm-responses', 'lib/index.js', 'codex', 'lib/responses.js'],
  ['draco-image-gen', 'lib/index.js', 'codex', 'lib/image-gen/index.js'],
  ['draco-image-gen', 'lib/invariant.js', 'codex', 'lib/image-gen/invariant.js'],
  // grok layer (publishes as draco-grok-oauth at the repo root)
  ['draco-oauth-xai-ui', 'lib/index.js', '', 'lib/index.js'],
  ['draco-oauth-xai-ui', 'lib/invariant.js', '', 'lib/invariant.js'],
  ['draco-oauth-xai', 'lib/index.js', '', 'lib/oauth/index.js'],
  ['draco-oauth-xai', 'lib/invariant.js', '', 'lib/oauth/invariant.js'],
  ['draco-oauth-xai', 'lib/types/types.js', '', 'lib/types.js'],
  ['draco-llm-responses', 'lib/index.js', '', 'lib/responses/index.js'],
  ['draco-llm-responses', 'lib/invariant.js', '', 'lib/responses/invariant.js'],
]

/** [forkPackage, forkFile, publishFile] — copied with id rewrite per layer. */
const REWRITTEN = [
  ['draco-oauth-codex-ui', 'lib/client.js', 'lib/client.js'],
  ['draco-oauth-codex', 'lib/typert.host.js', 'lib/typert.host.js'],
  ['draco-oauth-codex', 'lib/typert.remote-client.js', 'lib/typert.remote-client.js'],
  ['draco-oauth-xai-ui', 'lib/client.js', 'lib/client.js'],
  ['draco-oauth-xai', 'lib/typert.host.js', 'lib/typert.host.js'],
  ['draco-oauth-xai', 'lib/typert.remote-client.js', 'lib/typert.remote-client.js'],
]

function layerFor(dir) {
  const layer = LAYERS.find((entry) => entry.dir === dir)
  if (layer === undefined) throw new Error(`no publish layer for directory "${dir}"`)
  return layer
}

function copyPlain(forkPackage, forkFile, layerDir, publishFile) {
  const source = join(dracoRoot, forkPackage, forkFile)
  const target = join(publishRoot, layerDir, publishFile)
  if (!existsSync(source)) throw new Error(`missing fork build output: ${source} — build the fork first`)
  mkdirSync(dirname(target), { recursive: true })
  copyFileSync(source, target)
  console.log(`copy  ${layerDir ? `${layerDir}/` : ''}${publishFile}`)
}

function copyRewritten(forkPackage, forkFile, publishFile) {
  const layerDir = forkPackage.includes('codex') ? 'codex' : ''
  const layer = layerFor(layerDir)
  const source = join(dracoRoot, forkPackage, forkFile)
  const target = join(publishRoot, layerDir, publishFile)
  if (!existsSync(source)) throw new Error(`missing fork build output: ${source} — build the fork first`)
  let content = readFileSync(source, 'utf8')
  for (const scopedId of layer.scopedIds) {
    content = content.split(scopedId).join(layer.packageName)
  }
  const leftover = content.match(/@deepseek-ai\/dsh-draco-[a-z-]+/g)
  // Bundled comments may reference other draco packages (e.g. image-gen);
  // those are documentation, not registration ids, and stay as-is.
  const allowed = new Set(['@deepseek-ai/dsh-draco-image-gen'])
  if (leftover !== null && !leftover.every((id) => allowed.has(id))) {
    throw new Error(`${forkFile}: unexpected scoped ids remain after rewrite: ${[...new Set(leftover)].join(', ')}`)
  }
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, content)
  console.log(`patch ${layerDir ? `${layerDir}/` : ''}${publishFile} (${layer.packageName})`)
}

for (const [pkg, file, dir, out] of COPIES) copyPlain(pkg, file, dir, out)
for (const [pkg, file, out] of REWRITTEN) copyRewritten(pkg, file, out)

// The client bundle must register the published package name; fail loudly
// instead of shipping a bundle the host loader would reject at boot.
for (const layer of LAYERS) {
  const client = readFileSync(join(publishRoot, layer.dir, 'lib/client.js'), 'utf8')
  if (!client.includes(`id: "${layer.packageName}"`)) {
    throw new Error(`${layer.dir || '.'}/lib/client.js does not register "${layer.packageName}"`)
  }
}
console.log('ok: client bundles register the published package names')
