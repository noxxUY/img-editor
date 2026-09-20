export const SECTOR = 2048
export const ENTRY_SIZE = 32
export const NAME_BYTES = 24
export const MAX_NAME_LENGTH = NAME_BYTES - 1

export type ImgVersion = 1 | 2

export interface DirEntry {
  name: string
  offset: number
  size: number
}

export type HeaderKind = 'v2' | 'v3' | 'v3-encrypted' | 'raw'

const latin1 = new TextDecoder('latin1')

export function sectorsToBytes(sectors: number): number {
  return sectors * SECTOR
}

export function bytesToSectors(bytes: number): number {
  return Math.ceil(bytes / SECTOR)
}

export function alignToSector(bytes: number): number {
  return bytesToSectors(bytes) * SECTOR
}

export function detectHeader(head: Uint8Array): HeaderKind {
  if (head.length >= 4) {
    const tag = latin1.decode(head.subarray(0, 4))
    if (tag === 'VER2') return 'v2'
    if (tag === 'VERF') return 'v3-encrypted'
    // Unencrypted GTA IV archives start with 0xA94E2A52 (little endian).
    if (head[0] === 0x52 && head[1] === 0x2a && head[2] === 0x4e && head[3] === 0xa9) return 'v3'
  }
  return 'raw'
}

export function decodeName(bytes: Uint8Array): string {
  let end = bytes.indexOf(0)
  if (end < 0) end = bytes.length
  return latin1.decode(bytes.subarray(0, end))
}

export function encodeName(name: string): Uint8Array {
  const out = new Uint8Array(NAME_BYTES)
  for (let i = 0; i < Math.min(name.length, MAX_NAME_LENGTH); i++) {
    out[i] = name.charCodeAt(i) & 0xff
  }
  return out
}

const FORBIDDEN = '\\/:*?"<>|'

export function nameProblem(name: string): string | null {
  if (name.length === 0) return 'Name is empty'
  if (name.length > MAX_NAME_LENGTH) return `Name is longer than ${MAX_NAME_LENGTH} characters`
  for (let i = 0; i < name.length; i++) {
    const c = name.charCodeAt(i)
    if (c < 0x20 || c > 0xff) return 'Name has characters outside Latin-1'
    if (FORBIDDEN.includes(name[i])) return `Name contains "${name[i]}"`
  }
  return null
}

function readEntries(bytes: Uint8Array, count: number, v2: boolean): DirEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const entries: DirEntry[] = []
  for (let i = 0; i < count; i++) {
    const base = i * ENTRY_SIZE
    if (base + ENTRY_SIZE > bytes.length) break
    const offset = view.getUint32(base, true)
    let sizeSectors: number
    if (v2) {
      const streaming = view.getUint16(base + 4, true)
      const inArchive = view.getUint16(base + 6, true)
      sizeSectors = streaming !== 0 ? streaming : inArchive
    } else {
      sizeSectors = view.getUint32(base + 4, true)
    }
    const name = decodeName(bytes.subarray(base + 8, base + 8 + NAME_BYTES))
    entries.push({ name, offset: sectorsToBytes(offset), size: sectorsToBytes(sizeSectors) })
  }
  return entries
}

export function parseDir(dir: Uint8Array): DirEntry[] {
  return readEntries(dir, Math.floor(dir.length / ENTRY_SIZE), false)
}

export function parseV2Count(head: Uint8Array): number {
  const view = new DataView(head.buffer, head.byteOffset, head.byteLength)
  return view.getUint32(4, true)
}

export function parseV2Entries(table: Uint8Array, count: number): DirEntry[] {
  return readEntries(table, count, true)
}

export function v2DirectorySize(count: number): number {
  return alignToSector(8 + count * ENTRY_SIZE)
}

export interface LayoutInput {
  name: string
  size: number
}

export interface LayoutEntry extends LayoutInput {
  offset: number
  paddedSize: number
}

export function layoutEntries(inputs: LayoutInput[], dataStart: number): LayoutEntry[] {
  let cursor = dataStart
  return inputs.map((e) => {
    const paddedSize = alignToSector(e.size)
    const out = { ...e, offset: cursor, paddedSize }
    cursor += paddedSize
    return out
  })
}

function writeEntries(entries: LayoutEntry[], v2: boolean, target: Uint8Array, at: number) {
  const view = new DataView(target.buffer, target.byteOffset, target.byteLength)
  entries.forEach((e, i) => {
    const base = at + i * ENTRY_SIZE
    view.setUint32(base, e.offset / SECTOR, true)
    const sectors = e.paddedSize / SECTOR
    if (v2) {
      if (sectors > 0xffff) throw new Error(`"${e.name}" is too large for IMG v2 (max 128 MB per entry)`)
      view.setUint16(base + 4, sectors, true)
      view.setUint16(base + 6, 0, true)
    } else {
      view.setUint32(base + 4, sectors, true)
    }
    target.set(encodeName(e.name), base + 8)
  })
}

export function buildDir(entries: LayoutEntry[]): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(entries.length * ENTRY_SIZE)
  writeEntries(entries, false, out, 0)
  return out
}

export function buildV2Header(entries: LayoutEntry[]): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(v2DirectorySize(entries.length))
  out.set([0x56, 0x45, 0x52, 0x32]) // "VER2"
  new DataView(out.buffer).setUint32(4, entries.length, true)
  writeEntries(entries, true, out, 8)
  return out
}
