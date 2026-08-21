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
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const publishRoot = resolve(here, '..')
const forkRoot = resolve(process.argv[2] ?? join(homedir(), 'REPO', 'deepseek-harness'))
const dracoRoot = join(forkRoot, 'packages', 'draco')

/**
 * One publish layer: subdirectory, published package name, and the scoped
 * fork ids that must become that name.
 * Order matters: the longer `-ui` id is rewritten first.
 */
const LAYERS = [
  {
    dir: 'codex',
    packageName: 'draco-codex-oauth',
    scopedIds: ['@deepseek-ai/dsh-draco-oauth-codex-ui', '@deepseek-ai/dsh-draco-oauth-codex'],
  },
  {
    dir: 'grok',
    packageName: 'draco-grok-oauth',
    scopedIds: ['@deepseek-ai/dsh-draco-oauth-xai-ui', '@deepseek-ai/dsh-draco-oauth-xai'],
  },
  {
    dir: 'speech',
    packageName: 'draco-speech-gen',
    scopedIds: ['@deepseek-ai/dsh-draco-speech-gen-ui', '@deepseek-ai/dsh-draco-speech-gen'],
  },
  {
    dir: 'seedance',
    packageName: 'draco-seedance-gen',
    scopedIds: ['@deepseek-ai/dsh-draco-seedance-gen-ui', '@deepseek-ai/dsh-draco-seedance-gen'],
  },
  {
    dir: 'x-search',
    packageName: 'draco-x-search',
    scopedIds: ['@deepseek-ai/dsh-draco-x-search-ui', '@deepseek-ai/dsh-draco-x-search'],
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
  // grok layer (publishes as draco-grok-oauth under grok/)
  ['draco-oauth-xai-ui', 'lib/index.js', 'grok', 'lib/index.js'],
  ['draco-oauth-xai-ui', 'lib/invariant.js', 'grok', 'lib/invariant.js'],
  ['draco-oauth-xai', 'lib/index.js', 'grok', 'lib/oauth/index.js'],
  ['draco-oauth-xai', 'lib/invariant.js', 'grok', 'lib/oauth/invariant.js'],
  ['draco-oauth-xai', 'lib/types/types.js', 'grok', 'lib/types.js'],
  ['draco-llm-responses', 'lib/index.js', 'grok', 'lib/responses/index.js'],
  ['draco-llm-responses', 'lib/invariant.js', 'grok', 'lib/responses/invariant.js'],
  ['draco-image-gen', 'lib/index.js', 'grok', 'lib/imagine/index.js'],
  ['draco-image-gen', 'lib/invariant.js', 'grok', 'lib/imagine/invariant.js'],
  // speech layer (publishes as draco-speech-gen under speech/)
  ['draco-speech-gen-ui', 'lib/index.js', 'speech', 'lib/index.js'],
  ['draco-speech-gen-ui', 'lib/invariant.js', 'speech', 'lib/invariant.js'],
  ['draco-speech-gen', 'lib/index.js', 'speech', 'lib/speech/index.js'],
  ['draco-speech-gen', 'lib/invariant.js', 'speech', 'lib/speech/invariant.js'],
  // seedance layer (publishes as draco-seedance-gen under seedance/)
  ['draco-seedance-gen-ui', 'lib/index.js', 'seedance', 'lib/index.js'],
  ['draco-seedance-gen-ui', 'lib/invariant.js', 'seedance', 'lib/invariant.js'],
  ['draco-seedance-gen', 'lib/index.js', 'seedance', 'lib/seedance/index.js'],
  ['draco-seedance-gen', 'lib/invariant.js', 'seedance', 'lib/seedance/invariant.js'],
  ['draco-seedance-gen', 'lib/types/types.js', 'seedance', 'lib/types.js'],
  ['draco-x-search-ui', 'lib/index.js', 'x-search', 'lib/index.js'],
  ['draco-x-search-ui', 'lib/invariant.js', 'x-search', 'lib/invariant.js'],
  ['draco-x-search', 'lib/index.js', 'x-search', 'lib/x-search/index.js'],
  ['draco-x-search', 'lib/invariant.js', 'x-search', 'lib/x-search/invariant.js'],
]

/** [forkPackage, forkFile, publishFile] — copied with id rewrite per layer. */
const REWRITTEN = [
  ['draco-oauth-codex-ui', 'lib/client.js', 'lib/client.js'],
  ['draco-oauth-codex', 'lib/typert.host.js', 'lib/typert.host.js'],
  ['draco-oauth-codex', 'lib/typert.remote-client.js', 'lib/typert.remote-client.js'],
  ['draco-oauth-xai-ui', 'lib/client.js', 'lib/client.js'],
  ['draco-oauth-xai', 'lib/typert.host.js', 'lib/typert.host.js'],
  ['draco-oauth-xai', 'lib/typert.remote-client.js', 'lib/typert.remote-client.js'],
  ['draco-speech-gen-ui', 'lib/client.js', 'lib/client.js'],
  ['draco-seedance-gen-ui', 'lib/client.js', 'lib/client.js'],
  ['draco-seedance-gen', 'lib/typert.host.js', 'lib/typert.host.js'],
  ['draco-seedance-gen', 'lib/typert.remote-client.js', 'lib/typert.remote-client.js'],
  ['draco-x-search-ui', 'lib/client.js', 'lib/client.js'],
]

function layerDirFor(forkPackage) {
  if (forkPackage.includes('codex')) return 'codex'
  if (forkPackage.includes('speech')) return 'speech'
  if (forkPackage.includes('seedance')) return 'seedance'
  if (forkPackage.includes('x-search')) return 'x-search'
  if (forkPackage.includes('xai')) return 'grok'
  throw new Error(`no publish layer for fork package ${forkPackage}`)
}

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
  const layerDir = layerDirFor(forkPackage)
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

const identity = spawnSync(process.execPath, [join(here, 'verify-plugin-ids.mjs')], {
  cwd: publishRoot,
  stdio: 'inherit',
})
if (identity.status !== 0) {
  throw new Error('verify-plugin-ids failed; independently installed plugins must not share Loader, tool, or Settings seat ids')
}
