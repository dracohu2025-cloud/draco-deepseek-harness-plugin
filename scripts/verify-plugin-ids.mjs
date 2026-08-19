#!/usr/bin/env node
/**
 * Fail the publish sync when independently installed Draco bundles share a
 * Loader row id, a non-shared tool name, or a Settings seat id.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const publishRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

const LAYERS = [
  { name: 'grok', dir: '', packageName: 'draco-grok-oauth' },
  { name: 'codex', dir: 'codex', packageName: 'draco-codex-oauth' },
  { name: 'speech', dir: 'speech', packageName: 'draco-speech-gen' },
]

const SHARED_TOOLS = new Set(['image_generate', 'video_generate'])
const SHARED_SEATS = new Set(['draco-image-gen', 'draco-video-gen', 'draco-suite'])
const PACKAGE_IDS = new Set(LAYERS.map(layer => layer.packageName))

const EXCLUSIVE_SEATS = {
  grok: new Set(['xai-oauth']),
  codex: new Set(['codex-oauth']),
  speech: new Set(['draco-speech-card']),
}

function listFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) listFiles(path, out)
    else if (name.endsWith('.js') || name.endsWith('.yml')) out.push(path)
  }
  return out
}

function patchIds(text) {
  return [...text.matchAll(/^\s*- id:\s+(draco-\S+)\s*$/gm)].map(match => match[1])
}

function toolNames(text) {
  return new Set([...text.matchAll(/\bname:\s*"(image_generate|video_generate|speech_generate)"/g)].map(match => match[1]))
}

function seatIds(text, packageName) {
  const ids = new Set()
  for (const match of text.matchAll(/\w+_SEAT_ID\s*=\s*"([^"]+)"/g)) ids.add(match[1])
  for (const match of text.matchAll(/\bid:\s*"([^"]+)"/g)) {
    const id = match[1]
    if (PACKAGE_IDS.has(id) || id === packageName) continue
    if (id.includes('/')) continue
    if (/^(draco-|xai-oauth$|codex-oauth$)/.test(id)) ids.add(id)
  }
  return ids
}

const failures = []
const idsByLayer = new Map()
const toolsByLayer = new Map()
const seatsByLayer = new Map()

for (const layer of LAYERS) {
  const root = join(publishRoot, layer.dir)
  const patch = readFileSync(join(root, 'cordis.patch.yml'), 'utf8')
  const ids = patchIds(patch)
  idsByLayer.set(layer.name, ids)
  const tools = new Set()
  const seats = new Set()
  for (const file of listFiles(join(root, 'lib'))) {
    const text = readFileSync(file, 'utf8')
    for (const name of toolNames(text)) tools.add(name)
    if (file.endsWith(`${join('lib', 'client.js')}`)) {
      for (const id of seatIds(text, layer.packageName)) seats.add(id)
    }
  }
  toolsByLayer.set(layer.name, tools)
  seatsByLayer.set(layer.name, seats)
}

const seenIds = new Map()
for (const [layer, ids] of idsByLayer) {
  for (const id of ids) {
    const prev = seenIds.get(id)
    if (prev !== undefined) failures.push(`cordis row id "${id}" is in both ${prev} and ${layer}`)
    else seenIds.set(id, layer)
  }
}

for (const [layer, tools] of toolsByLayer) {
  if (layer !== 'speech' && tools.has('speech_generate')) {
    failures.push(`${layer} host artifacts still register speech_generate`)
  }
  if (layer === 'speech') {
    for (const name of SHARED_TOOLS) {
      if (tools.has(name)) failures.push(`speech host artifacts register shared tool ${name}`)
    }
  }
}

for (const [layer, seats] of seatsByLayer) {
  if (layer !== 'speech' && (seats.has('draco-speech-gen') || seats.has('draco-speech-card'))) {
    failures.push(`${layer} client still registers a speech Settings seat (${[...seats].filter(id => id.startsWith('draco-speech')).join(', ')})`)
  }
  const exclusive = EXCLUSIVE_SEATS[layer]
  for (const [other, otherSeats] of Object.entries(EXCLUSIVE_SEATS)) {
    if (other === layer) continue
    for (const id of otherSeats) {
      if (seats.has(id)) failures.push(`${layer} client registers ${other} seat "${id}"`)
    }
  }
  for (const id of exclusive) {
    if (!seats.has(id)) failures.push(`${layer} client is missing exclusive seat "${id}"`)
  }
  for (const id of seats) {
    if (SHARED_SEATS.has(id) || exclusive.has(id)) continue
    if (id.startsWith('draco-speech')) continue
    failures.push(`${layer} client registers undocumented Settings seat "${id}"`)
  }
}

if (failures.length > 0) {
  throw new Error(`Draco plugin identity collisions:\n- ${failures.join('\n- ')}`)
}
console.log('ok: independently installed Draco plugins do not share Loader, tool, or Settings seat ids')
