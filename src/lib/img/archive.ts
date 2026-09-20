import {
  SECTOR,
  alignToSector,
  buildDir,
  buildV2Header,
  detectHeader,
  layoutEntries,
  parseDir,
  parseV2Count,
  parseV2Entries,
  v2DirectorySize,
  type ImgVersion,
  type LayoutEntry,
} from './format'

export type EntrySource = { kind: 'archive'; offset: number } | { kind: 'blob'; blob: Blob }

export type EntryStatus = 'original' | 'added' | 'replaced' | 'renamed'

export interface ImgEntry {
  id: number
  name: string
  size: number
  source: EntrySource
  status: EntryStatus
  originalName?: string
}

export interface ImgArchive {
  version: ImgVersion
  name: string
  img: File
  dir?: File
  imgHandle?: FileSystemFileHandle
  dirHandle?: FileSystemFileHandle
  entries: ImgEntry[]
  openedCount: number
  imgSize: number
  dataStart: number
}

export interface OpenInput {
  img: File
  dir?: File
  imgHandle?: FileSystemFileHandle
  dirHandle?: FileSystemFileHandle
}

let nextId = 1
export function allocId(): number {
  return nextId++
}

async function readSlice(file: Blob, start: number, end: number): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(start, end).arrayBuffer())
}

export class ImgOpenError extends Error {}

export async function openArchive(input: OpenInput): Promise<ImgArchive> {
  const { img, dir } = input
  const head = await readSlice(img, 0, Math.min(8, img.size))
  const kind = detectHeader(head)

  if (kind === 'v3' || kind === 'v3-encrypted') {
    throw new ImgOpenError(
      'This is a GTA IV archive (IMG v3). Only GTA III, Vice City and San Andreas archives are supported.',
    )
  }

  let version: ImgVersion
  let raw: { name: string; offset: number; size: number }[]
  let dataStart = 0

  if (kind === 'v2') {
    version = 2
    const count = parseV2Count(head)
    const table = await readSlice(img, 8, 8 + count * 32)
    raw = parseV2Entries(table, count)
    dataStart = v2DirectorySize(count)
  } else {
    if (!dir) {
      throw new ImgOpenError(
        `${img.name} looks like a GTA III / Vice City archive (IMG v1), which needs its .dir file. Drop the .img and the .dir together.`,
      )
    }
    version = 1
    raw = parseDir(new Uint8Array(await dir.arrayBuffer()))
  }

  const entries: ImgEntry[] = raw.map((e) => ({
    id: allocId(),
    name: e.name,
    size: e.size,
    source: { kind: 'archive', offset: e.offset },
    status: 'original',
  }))

  return {
    version,
    name: img.name,
    img,
    dir,
    imgHandle: input.imgHandle,
    dirHandle: input.dirHandle,
    entries,
    openedCount: entries.length,
    imgSize: img.size,
    dataStart,
  }
}

export function entryBlob(archive: ImgArchive, entry: ImgEntry): Blob {
  if (entry.source.kind === 'blob') return entry.source.blob
  const start = entry.source.offset
  return archive.img.slice(start, Math.min(start + entry.size, archive.img.size))
}

export async function entryBytes(archive: ImgArchive, entry: ImgEntry): Promise<Uint8Array> {
  return new Uint8Array(await entryBlob(archive, entry).arrayBuffer())
}

export interface ArchiveStats {
  count: number
  rebuiltSize: number
  delta: number
  modified: boolean
}

export function archiveStats(archive: ImgArchive): ArchiveStats {
  let dataBytes = 0
  let modified = archive.entries.length !== archive.openedCount
  for (const e of archive.entries) {
    dataBytes += alignToSector(e.size)
    if (e.status !== 'original') modified = true
  }
  const dataStart = archive.version === 2 ? v2DirectorySize(archive.entries.length) : 0
  const rebuiltSize = dataStart + dataBytes
  return {
    count: archive.entries.length,
    rebuiltSize,
    delta: archive.imgSize - rebuiltSize,
    modified,
  }
}

export interface BuildOutput {
  imgParts: Blob[]
  dir?: Uint8Array<ArrayBuffer>
  imgSize: number
  layout: LayoutEntry[]
}

const ZERO_SECTOR = new Blob([new Uint8Array(SECTOR)])

export function buildArchive(archive: ImgArchive): BuildOutput {
  const dataStart = archive.version === 2 ? v2DirectorySize(archive.entries.length) : 0
  const layout = layoutEntries(
    archive.entries.map((e) => ({ name: e.name, size: e.size })),
    dataStart,
  )
  const imgParts: Blob[] = []
  if (archive.version === 2) imgParts.push(new Blob([buildV2Header(layout)]))
  archive.entries.forEach((entry, i) => {
    const l = layout[i]
    const data = entryBlob(archive, entry)
    imgParts.push(data)
    const pad = l.paddedSize - data.size
    if (pad > 0) imgParts.push(ZERO_SECTOR.slice(0, pad))
  })
  const last = layout[layout.length - 1]
  const imgSize = last ? last.offset + last.paddedSize : dataStart
  return {
    imgParts,
    dir: archive.version === 1 ? buildDir(layout) : undefined,
    imgSize,
    layout,
  }
}

export function byOffset(a: ImgEntry, b: ImgEntry): number {
  const ao = a.source.kind === 'archive' ? a.source.offset : Number.MAX_SAFE_INTEGER
  const bo = b.source.kind === 'archive' ? b.source.offset : Number.MAX_SAFE_INTEGER
  return ao - bo
}

export function findByName(entries: ImgEntry[], name: string): ImgEntry | undefined {
  const lower = name.toLowerCase()
  return entries.find((e) => e.name.toLowerCase() === lower)
}

export function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot < 0 ? '' : name.slice(dot + 1).toLowerCase()
}
