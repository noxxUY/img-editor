import { extensionOf } from './img/archive'
import { RW, rwRootType } from './rw/stream'

export type FileKind = 'dff' | 'txd' | 'col' | 'ifp' | 'text' | 'empty' | 'unknown'

const latin1 = new TextDecoder('latin1')
const TEXT_EXTENSIONS = new Set(['ipl', 'ide', 'dat', 'txt', 'cfg', 'zon', 'ini', 'scm'])

export function detectKind(name: string, head: Uint8Array): FileKind {
  if (head.length === 0) return 'empty'
  const ext = extensionOf(name)
  const root = rwRootType(head)
  if (root === RW.CLUMP || root === RW.UV_ANIM_DICT) return 'dff'
  if (root === RW.TEXTURE_DICTIONARY) return 'txd'
  const tag = head.length >= 4 ? latin1.decode(head.subarray(0, 4)) : ''
  if (tag === 'COLL' || tag === 'COL2' || tag === 'COL3' || tag === 'COL4') return 'col'
  if (tag === 'ANPK' || tag === 'ANP3') return 'ifp'
  if (TEXT_EXTENSIONS.has(ext) && ext !== 'scm') return 'text'
  if (ext === 'dff') return 'dff'
  if (ext === 'txd') return 'txd'
  if (ext === 'col') return 'col'
  if (ext === 'ifp') return 'ifp'
  if (looksLikeText(head)) return 'text'
  return 'unknown'
}

function looksLikeText(bytes: Uint8Array): boolean {
  const n = Math.min(bytes.length, 512)
  if (n === 0) return false
  let printable = 0
  for (let i = 0; i < n; i++) {
    const c = bytes[i]
    if (c === 9 || c === 10 || c === 13 || (c >= 32 && c < 127)) printable++
    else if (c === 0) return false
  }
  return printable / n > 0.95
}

export interface ColModel {
  version: string
  name: string
  modelId: number
  size: number
}

export function listColModels(bytes: Uint8Array): ColModel[] {
  const out: ColModel[] = []
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let at = 0
  while (at + 8 <= bytes.length) {
    const tag = latin1.decode(bytes.subarray(at, at + 4))
    if (!tag.startsWith('COL')) break
    const size = view.getUint32(at + 4, true)
    if (size === 0) break
    const nameBytes = bytes.subarray(at + 8, at + 30)
    let end = nameBytes.indexOf(0)
    if (end < 0) end = nameBytes.length
    const name = latin1.decode(nameBytes.subarray(0, end))
    const modelId = at + 32 <= bytes.length ? view.getUint16(at + 30, true) : 0
    out.push({ version: tag === 'COLL' ? 'COL1' : tag, name, modelId, size })
    at += 8 + size
  }
  return out
}

export function ifpInfo(bytes: Uint8Array): { version: string; name: string } | null {
  if (bytes.length < 12) return null
  const tag = latin1.decode(bytes.subarray(0, 4))
  if (tag === 'ANP3') {
    const nameBytes = bytes.subarray(8, 32)
    let end = nameBytes.indexOf(0)
    if (end < 0) end = nameBytes.length
    return { version: 'ANP3 (San Andreas)', name: latin1.decode(nameBytes.subarray(0, end)) }
  }
  if (tag === 'ANPK') {
    // ANPK <size> INFO <size> <count> <name...>
    const nameStart = 20
    const nameBytes = bytes.subarray(nameStart, Math.min(nameStart + 24, bytes.length))
    let end = nameBytes.indexOf(0)
    if (end < 0) end = nameBytes.length
    return { version: 'ANPK (III / Vice City)', name: latin1.decode(nameBytes.subarray(0, end)) }
  }
  return null
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function hexDump(bytes: Uint8Array, maxBytes = 512): string {
  const lines: string[] = []
  const n = Math.min(bytes.length, maxBytes)
  for (let at = 0; at < n; at += 16) {
    const row = bytes.subarray(at, Math.min(at + 16, n))
    const hex = [...row].map((b) => b.toString(16).padStart(2, '0')).join(' ')
    const ascii = [...row].map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.')).join('')
    lines.push(`${at.toString(16).padStart(8, '0')}  ${hex.padEnd(47)}  ${ascii}`)
  }
  return lines.join('\n')
}
