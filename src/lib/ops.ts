import { allocId, extensionOf, findByName, type ImgEntry } from './img/archive'
import { nameProblem } from './img/format'

export interface AddResult {
  entries: ImgEntry[]
  added: string[]
  replaced: string[]
  rejected: { name: string; reason: string }[]
}

export function addOrReplaceFiles(entries: ImgEntry[], files: File[]): AddResult {
  const out = [...entries]
  const added: string[] = []
  const replaced: string[] = []
  const rejected: { name: string; reason: string }[] = []
  for (const file of files) {
    const problem = nameProblem(file.name)
    if (problem) {
      rejected.push({ name: file.name, reason: problem })
      continue
    }
    const existing = findByName(out, file.name)
    if (existing) {
      const i = out.indexOf(existing)
      out[i] = withData(existing, file)
      replaced.push(file.name)
    } else {
      out.push({
        id: allocId(),
        name: file.name,
        size: file.size,
        source: { kind: 'blob', blob: file },
        status: 'added',
      })
      added.push(file.name)
    }
  }
  return { entries: out, added, replaced, rejected }
}

function withData(entry: ImgEntry, file: File): ImgEntry {
  return {
    ...entry,
    size: file.size,
    source: { kind: 'blob', blob: file },
    status: entry.status === 'added' ? 'added' : 'replaced',
    originalName: entry.originalName ?? (entry.status === 'added' ? undefined : entry.name),
  }
}

export function replaceEntry(entries: ImgEntry[], id: number, file: File): ImgEntry[] {
  return entries.map((e) => (e.id === id ? withData(e, file) : e))
}

export function renameEntry(entries: ImgEntry[], id: number, name: string): ImgEntry[] {
  return entries.map((e) => {
    if (e.id !== id) return e
    if (e.status === 'added') return { ...e, name }
    const originalName = e.originalName ?? e.name
    const status: ImgEntry['status'] =
      e.status === 'replaced' ? 'replaced' : name === originalName && e.source.kind === 'archive' ? 'original' : 'renamed'
    return { ...e, name, originalName, status }
  })
}

export function deleteEntries(entries: ImgEntry[], ids: Set<number>): ImgEntry[] {
  return entries.filter((e) => !ids.has(e.id))
}

export type KindFilter = 'all' | 'dff' | 'txd' | 'col' | 'ifp' | 'other'

const KNOWN = new Set(['dff', 'txd', 'col', 'ifp'])

export function matchesKind(entry: ImgEntry, kind: KindFilter): boolean {
  if (kind === 'all') return true
  const ext = extensionOf(entry.name)
  if (kind === 'other') return !KNOWN.has(ext)
  return ext === kind
}

export function matchesQuery(entry: ImgEntry, terms: string[]): boolean {
  if (terms.length === 0) return true
  const name = entry.name.toLowerCase()
  return terms.every((t) => name.includes(t))
}

export interface SortState {
  key: 'order' | 'name' | 'size' | 'status'
  dir: 1 | -1
}

export function sortEntries(entries: ImgEntry[], sort: SortState): ImgEntry[] {
  if (sort.key === 'order') return sort.dir === 1 ? entries : [...entries].reverse()
  const out = [...entries]
  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })
  out.sort((a, b) => {
    let cmp = 0
    if (sort.key === 'name') cmp = collator.compare(a.name, b.name)
    else if (sort.key === 'size') cmp = a.size - b.size
    else cmp = statusRank(a) - statusRank(b)
    if (cmp === 0) cmp = collator.compare(a.name, b.name)
    return cmp * sort.dir
  })
  return out
}

function statusRank(e: ImgEntry): number {
  switch (e.status) {
    case 'added':
      return 0
    case 'replaced':
      return 1
    case 'renamed':
      return 2
    default:
      return 3
  }
}
