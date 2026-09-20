import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  archiveStats,
  buildArchive,
  entryBlob,
  openArchive,
  type ImgArchive,
  type ImgEntry,
} from './lib/img/archive'
import { nameProblem } from './lib/img/format'
import {
  downloadBlob,
  filesFromDrop,
  hasDirectoryPicker,
  hasFileSystemAccess,
  pairArchive,
  pickArchiveFiles,
  pickDirectory,
  pickFiles,
  writeFileInDirectory,
  writeParts,
  writePartsInDirectory,
  type PickedFile,
} from './lib/fs'
import { filesFromZip, isZip } from './lib/zip'
import { Menu } from './components/Menu'
import {
  addOrReplaceFiles,
  deleteEntries,
  matchesKind,
  matchesQuery,
  renameEntry,
  replaceEntry,
  sortEntries,
  type KindFilter,
  type SortState,
} from './lib/ops'
import { zipEntries } from './lib/extract'
import { formatBytes } from './lib/detect'
import { parseIde, type IdeMap } from './lib/ide'
import { buildTxdIndex, type TxdIndex } from './lib/txdIndex'
import { KIND_COLORS, KIND_LABELS, kindOf, type Kind } from './lib/kinds'
import type { TextureHelp } from './components/DffPreview'
import { Brand } from './components/Brand'
import { Footer } from './components/Footer'
import { ThemeToggle } from './components/ThemeToggle'
import { EntryList } from './components/EntryList'
import { Inspector } from './components/Inspector'
import { SectorMap } from './components/SectorMap'
import { Modal } from './components/Modal'
import { Toasts, useToasts } from './components/Toasts'

type ModalState =
  | { kind: 'rename'; entry: ImgEntry; value: string }
  | { kind: 'save-in-place' }
  | { kind: 'discard' }
  | { kind: 'home' }

interface Busy {
  label: string
  done: number
  total: number
}

const KIND_FILTERS: { key: KindFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'dff', label: 'Models' },
  { key: 'txd', label: 'Textures' },
  { key: 'col', label: 'Collision' },
  { key: 'ifp', label: 'Animation' },
  { key: 'other', label: 'Other' },
]

export default function App() {
  const [archive, setArchive] = useState<ImgArchive | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [activeId, setActiveId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<KindFilter>('all')
  const [sort, setSort] = useState<SortState>({ key: 'order', dir: 1 })
  const [busy, setBusy] = useState<Busy | null>(null)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [dragging, setDragging] = useState(false)
  const [ideMap, setIdeMap] = useState<IdeMap>(() => new Map())
  const [txdIndex, setTxdIndex] = useState<TxdIndex | null>(null)
  const [indexing, setIndexing] = useState<{ done: number; total: number } | null>(null)
  const { toasts, push, dismiss } = useToasts()

  const stats = useMemo(() => (archive ? archiveStats(archive) : null), [archive])

  const visible = useMemo(() => {
    if (!archive) return []
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
    return sortEntries(
      archive.entries.filter((e) => matchesKind(e, kind) && matchesQuery(e, terms)),
      sort,
    )
  }, [archive, query, kind, sort])

  const activeEntry = useMemo(
    () => (archive && activeId !== null ? (archive.entries.find((e) => e.id === activeId) ?? null) : null),
    [archive, activeId],
  )
  const selectedEntries = useMemo(
    () => (archive ? archive.entries.filter((e) => selected.has(e.id)) : []),
    [archive, selected],
  )

  const setEntries = useCallback((entries: ImgEntry[]) => {
    setArchive((a) => (a ? { ...a, entries } : a))
  }, [])

  const loadArchive = useCallback(
    async (picked: PickedFile[]) => {
      const pair = pairArchive(picked)
      if (!pair) {
        push('error', 'Drop an .img archive. GTA III and Vice City archives also need their .dir file.')
        return
      }
      try {
        const opened = await openArchive({
          img: pair.img.file,
          dir: pair.dir?.file,
          imgHandle: pair.img.handle,
          dirHandle: pair.dir?.handle,
        })
        setArchive(opened)
        setSelected(new Set())
        setActiveId(null)
        setQuery('')
        setKind('all')
        setSort({ key: 'order', dir: 1 })
        setTxdIndex(null)
        const writable = !!opened.imgHandle && (opened.version === 2 || !!opened.dirHandle)
        push(
          'success',
          `Opened ${opened.name}: ${opened.entries.length.toLocaleString()} entries, IMG v${opened.version}${
            writable ? ', can be overwritten in place' : '. Saving downloads a copy in this browser'
          }`,
        )
      } catch (err) {
        push('error', err instanceof Error ? err.message : String(err))
      }
    },
    [push],
  )

  const expandZips = useCallback(
    async (files: File[]): Promise<File[]> => {
      const out: File[] = []
      for (const f of files) {
        if (!isZip(f)) {
          out.push(f)
          continue
        }
        try {
          const inside = await filesFromZip(f)
          out.push(...inside)
          push('info', `${f.name}: ${inside.length} file${inside.length === 1 ? '' : 's'} inside`)
        } catch (err) {
          push('error', `${f.name}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
      return out
    },
    [push],
  )

  const addFiles = useCallback(
    (files: File[]) => {
      if (!archive || files.length === 0) return
      const result = addOrReplaceFiles(archive.entries, files)
      setEntries(result.entries)
      const parts: string[] = []
      if (result.added.length) parts.push(`${result.added.length} added`)
      if (result.replaced.length) parts.push(`${result.replaced.length} replaced`)
      if (parts.length) push('success', parts.join(', '))
      for (const r of result.rejected) push('error', `${r.name}: ${r.reason}`)
      const ids = new Set(
        result.entries.filter((e) => result.added.includes(e.name) || result.replaced.includes(e.name)).map((e) => e.id),
      )
      if (ids.size) {
        setSelected(ids)
        setActiveId([...ids][0])
      }
    },
    [archive, push, setEntries],
  )

  const loadIdeFiles = useCallback(
    async (files: File[]) => {
      const ides = files.filter((f) => /\.ide$/i.test(f.name))
      if (ides.length === 0) {
        push('error', 'Pick .ide files (they are in the game’s data folder, for example data/maps/LA/LAe.ide).')
        return
      }
      const map = new Map(ideMap)
      const before = map.size
      for (const f of ides) parseIde(await f.text(), map)
      setIdeMap(map)
      push('success', `Loaded texture assignments for ${(map.size - before).toLocaleString()} models from ${ides.length} .ide file${ides.length === 1 ? '' : 's'}`)
    },
    [ideMap, push],
  )

  const buildIndex = useCallback(async () => {
    if (!archive || txdIndex || indexing) return
    const source = archive
    try {
      setIndexing({ done: 0, total: 1 })
      const index = await buildTxdIndex(source, (done, total) => setIndexing({ done, total }))
      setArchive((current) => {
        if (current?.img === source.img) setTxdIndex(index)
        return current
      })
      push('success', `Indexed ${index.textureCount.toLocaleString()} textures in ${index.txdCount.toLocaleString()} dictionaries`)
    } catch (err) {
      push('error', err instanceof Error ? err.message : String(err))
    } finally {
      setIndexing(null)
    }
  }, [archive, txdIndex, indexing, push])

  const textureHelp = useMemo<TextureHelp>(
    () => ({
      ideMap,
      index: txdIndex,
      indexing,
      onBuildIndex: buildIndex,
      onLoadIde: async () => loadIdeFiles(await pickFiles(true)),
    }),
    [ideMap, txdIndex, indexing, buildIndex, loadIdeFiles],
  )

  useEffect(() => {
    let depth = 0
    const onEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return
      depth++
      setDragging(true)
    }
    const onLeave = () => {
      depth = Math.max(0, depth - 1)
      if (depth === 0) setDragging(false)
    }
    const onOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) e.preventDefault()
    }
    const onDrop = async (e: DragEvent) => {
      e.preventDefault()
      depth = 0
      setDragging(false)
      if (!e.dataTransfer) return
      const zone = (e.target as HTMLElement | null)?.closest?.('[data-drop]')?.getAttribute('data-drop')
      const picked = await filesFromDrop(e.dataTransfer)
      if (picked.length === 0) return
      const hasImg = picked.some((p) => /\.(img|dir)$/i.test(p.file.name))
      if (hasImg || !archive) {
        await loadArchive(picked)
        return
      }
      if (zone === 'replace' && activeEntry) {
        const files = await expandZips(picked.map((p) => p.file))
        const file = files[0]
        if (!file) return
        setEntries(replaceEntry(archive.entries, activeEntry.id, file))
        push('success', `Replaced ${activeEntry.name} with ${file.name} (${formatBytes(file.size)})`)
        if (files.length > 1) push('info', `Only the first file was used; drop the others on "Add to archive" if you need them`)
        return
      }
      const ides = picked.filter((p) => /\.ide$/i.test(p.file.name)).map((p) => p.file)
      const rest = await expandZips(picked.filter((p) => !/\.ide$/i.test(p.file.name)).map((p) => p.file))
      if (ides.length) await loadIdeFiles(ides)
      if (rest.length) addFiles(rest)
    }
    window.addEventListener('dragenter', onEnter)
    window.addEventListener('dragleave', onLeave)
    window.addEventListener('dragover', onOver)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onEnter)
      window.removeEventListener('dragleave', onLeave)
      window.removeEventListener('dragover', onOver)
      window.removeEventListener('drop', onDrop)
    }
  }, [archive, activeEntry, loadArchive, addFiles, loadIdeFiles, expandZips, setEntries, push])

  useEffect(() => {
    if (!stats?.modified) return
    const onUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [stats?.modified])

  const open = useCallback(async () => {
    const picked = await pickArchiveFiles()
    if (picked.length) await loadArchive(picked)
  }, [loadArchive])

  const extract = useCallback(
    async (entries: ImgEntry[]) => {
      if (!archive || entries.length === 0) return
      if (entries.length === 1) {
        downloadBlob(entryBlob(archive, entries[0]), entries[0].name)
        push('success', `Extracted ${entries[0].name}`)
        return
      }
      try {
        if (hasDirectoryPicker) {
          const dir = await pickDirectory()
          if (!dir) return
          setBusy({ label: 'Extracting', done: 0, total: entries.length })
          for (let i = 0; i < entries.length; i++) {
            await writeFileInDirectory(dir, entries[i].name, entryBlob(archive, entries[i]))
            setBusy({ label: 'Extracting', done: i + 1, total: entries.length })
          }
          push('success', `Extracted ${entries.length} files to ${dir.name}`)
        } else {
          setBusy({ label: 'Zipping', done: 0, total: entries.length })
          const zip = await zipEntries(archive, entries, (done) => setBusy({ label: 'Zipping', done, total: entries.length }))
          downloadBlob(zip, `${archive.name.replace(/\.img$/i, '')}-extract.zip`)
          push('success', `Zipped ${entries.length} files`)
        }
      } catch (err) {
        push('error', err instanceof Error ? err.message : String(err))
      } finally {
        setBusy(null)
      }
    },
    [archive, push],
  )

  const zipSelected = useCallback(async () => {
    if (!archive || selectedEntries.length === 0) return
    try {
      setBusy({ label: 'Zipping', done: 0, total: selectedEntries.length })
      const zip = await zipEntries(archive, selectedEntries, (done) =>
        setBusy({ label: 'Zipping', done, total: selectedEntries.length }),
      )
      downloadBlob(zip, `${archive.name.replace(/\.img$/i, '')}-extract.zip`)
      push('success', `Zipped ${selectedEntries.length} files`)
    } catch (err) {
      push('error', err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }, [archive, selectedEntries, push])

  const replace = useCallback(
    async (entry: ImgEntry) => {
      if (!archive) return
      const [file] = await pickFiles(false)
      if (!file) return
      setEntries(replaceEntry(archive.entries, entry.id, file))
      push('success', `Replaced ${entry.name} with ${file.name} (${formatBytes(file.size)})`)
    },
    [archive, push, setEntries],
  )

  const remove = useCallback(
    (entries: ImgEntry[]) => {
      if (!archive || entries.length === 0) return
      const ids = new Set(entries.map((e) => e.id))
      setEntries(deleteEntries(archive.entries, ids))
      setSelected(new Set())
      if (activeId !== null && ids.has(activeId)) setActiveId(null)
      push('info', entries.length === 1 ? `Deleted ${entries[0].name}` : `Deleted ${entries.length} entries`)
    },
    [archive, activeId, push, setEntries],
  )

  const applyRename = useCallback(() => {
    if (!archive || modal?.kind !== 'rename') return
    const name = modal.value.trim()
    const problem = nameProblem(name)
    if (problem) {
      push('error', problem)
      return
    }
    const clash = archive.entries.find((e) => e.id !== modal.entry.id && e.name.toLowerCase() === name.toLowerCase())
    if (clash) {
      push('error', `${name} already exists in the archive`)
      return
    }
    setEntries(renameEntry(archive.entries, modal.entry.id, name))
    setModal(null)
    push('success', `Renamed ${modal.entry.name} to ${name}`)
  }, [archive, modal, push, setEntries])

  const canSaveInPlace = !!archive && !!archive.imgHandle && (archive.version === 2 || !!archive.dirHandle)

  const saveInPlace = useCallback(async () => {
    if (!archive || !archive.imgHandle) return
    setModal(null)
    const out = buildArchive(archive)
    try {
      setBusy({ label: `Writing ${archive.name}`, done: 0, total: out.imgSize })
      await writeParts(archive.imgHandle, out.imgParts, (written) =>
        setBusy({ label: `Writing ${archive.name}`, done: written, total: out.imgSize }),
      )
      if (out.dir && archive.dirHandle) {
        await writeParts(archive.dirHandle, [new Blob([out.dir])])
      }
      const img = await archive.imgHandle.getFile()
      const dir = archive.dirHandle ? await archive.dirHandle.getFile() : undefined
      const fresh = await openArchive({ img, dir, imgHandle: archive.imgHandle, dirHandle: archive.dirHandle })
      const activeName = activeEntry?.name.toLowerCase()
      setArchive(fresh)
      setTxdIndex(null)
      setSelected(new Set())
      setActiveId(activeName ? (fresh.entries.find((e) => e.name.toLowerCase() === activeName)?.id ?? null) : null)
      push('success', `Saved ${fresh.name} (${formatBytes(fresh.imgSize)}, ${fresh.entries.length.toLocaleString()} entries)`)
    } catch (err) {
      push('error', `Save failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setBusy(null)
    }
  }, [archive, activeEntry, push])

  const saveCopyToFolder = useCallback(async () => {
    if (!archive) return
    const dir = await pickDirectory('img-save')
    if (!dir) return
    const out = buildArchive(archive)
    try {
      setBusy({ label: `Writing ${archive.name} to ${dir.name}`, done: 0, total: out.imgSize })
      await writePartsInDirectory(dir, archive.name, out.imgParts, (written) =>
        setBusy({ label: `Writing ${archive.name} to ${dir.name}`, done: written, total: out.imgSize }),
      )
      if (out.dir) await writeFileInDirectory(dir, archive.name.replace(/\.img$/i, '') + '.dir', new Blob([out.dir]))
      push('success', `Saved a copy of ${archive.name} (${formatBytes(out.imgSize)}) in ${dir.name}`)
    } catch (err) {
      push('error', `Save failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setBusy(null)
    }
  }, [archive, push])

  const saveAsDownload = useCallback(() => {
    if (!archive) return
    const out = buildArchive(archive)
    downloadBlob(new Blob(out.imgParts), archive.name)
    if (out.dir) {
      const dirName = archive.name.replace(/\.img$/i, '') + '.dir'
      window.setTimeout(() => downloadBlob(new Blob([out.dir!]), dirName), 400)
      push('success', `Downloading ${archive.name} and ${dirName}`)
    } else {
      push('success', `Downloading ${archive.name} (${formatBytes(out.imgSize)})`)
    }
  }, [archive, push])

  const discard = useCallback(async () => {
    if (!archive) return
    setModal(null)
    const fresh = await openArchive({
      img: archive.img,
      dir: archive.dir,
      imgHandle: archive.imgHandle,
      dirHandle: archive.dirHandle,
    })
    setArchive(fresh)
    setTxdIndex(null)
    setSelected(new Set())
    setActiveId(null)
    push('info', 'Changes discarded')
  }, [archive, push])

  const closeArchive = useCallback(() => {
    setModal(null)
    setArchive(null)
    setSelected(new Set())
    setActiveId(null)
    setQuery('')
    setKind('all')
    setTxdIndex(null)
  }, [])

  const goHome = useCallback(() => {
    if (!archive) return
    if (stats?.modified) setModal({ kind: 'home' })
    else closeArchive()
  }, [archive, stats?.modified, closeArchive])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      if (e.key === 'o') {
        e.preventDefault()
        void open()
      } else if (e.key === 's' && archive) {
        e.preventDefault()
        if (canSaveInPlace) setModal({ kind: 'save-in-place' })
        else push('info', 'This archive cannot be overwritten from here. Use Save to download a rebuilt copy.')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, archive, canSaveInPlace, push])

  const onSelectionChange = useCallback((sel: Set<number>, active: number | null) => {
    setSelected(sel)
    setActiveId(active)
  }, [])

  const kindCounts = useMemo(() => {
    const counts: Record<Kind, number> = { dff: 0, txd: 0, col: 0, ifp: 0, other: 0 }
    if (archive) for (const e of archive.entries) counts[kindOf(e.name)]++
    return counts
  }, [archive])

  return (
    <div className="flex h-full flex-col">
      <header className="anim-fade-in flex min-h-11 shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-panel px-3 py-1.5">
        <Brand onClick={archive ? goHome : undefined} />
        {archive ? (
          <div className="flex min-w-0 flex-1 items-center gap-x-3 text-[12.5px]">
            <span className="h-4 w-px bg-line-strong" aria-hidden />
            <span className="truncate font-mono text-[12.5px]">{archive.name}</span>
            <span className="hidden text-muted sm:inline">
              IMG v{archive.version}, {archive.version === 2 ? 'San Andreas' : 'GTA III / Vice City'}
            </span>
            <span className="tnum hidden text-muted md:inline">{archive.entries.length.toLocaleString()} entries</span>
            {stats?.modified && (
              <span className="flex items-center gap-1.5 text-accent">
                <span className="inline-block size-1.5 bg-accent" aria-hidden />
                unsaved changes
              </span>
            )}
          </div>
        ) : (
          <span className="hidden flex-1 text-[12.5px] text-muted md:inline">GTA III, Vice City and San Andreas archives, in the browser</span>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="btn-group">
            <button className="btn" onClick={open} title="Ctrl+O">
              Open
            </button>
            {archive && (
              <button
                className="btn"
                onClick={async () => addFiles(await expandZips(await pickFiles(true)))}
                title="Files with a name that already exists replace that entry. Zips are opened."
              >
                Add files
              </button>
            )}
          </div>
          {archive && stats?.modified && (
            <button className="btn btn-ghost" onClick={() => setModal({ kind: 'discard' })}>
              Discard
            </button>
          )}
          {archive && (
            <Menu
              primary={!!stats?.modified}
              button={stats?.modified ? 'Save changes' : 'Save'}
              items={[
                {
                  label: `Overwrite ${archive.name}`,
                  hint: canSaveInPlace
                    ? 'Rewrites the file on disk in place, without gaps.'
                    : 'Needs Chrome or Edge and the archive opened with the Open button or dropped from Explorer.',
                  shortcut: 'Ctrl S',
                  disabled: !canSaveInPlace,
                  onSelect: () => setModal({ kind: 'save-in-place' }),
                },
                {
                  label: 'Save a copy to a folder…',
                  hint: hasDirectoryPicker
                    ? `Writes ${archive.name}${archive.version === 1 ? ' and its .dir' : ''} where you choose. The original stays untouched.`
                    : 'Not available in this browser; use Download instead.',
                  disabled: !hasDirectoryPicker,
                  onSelect: () => void saveCopyToFolder(),
                },
                {
                  label: 'Download rebuilt archive',
                  hint: 'Goes to your downloads folder. Works in every browser.',
                  onSelect: saveAsDownload,
                },
              ]}
            />
          )}
          <ThemeToggle />
        </div>
      </header>

      {archive ? (
        <div className="anim-fade-in grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(340px,2fr)_minmax(0,3fr)]">
          <section className="flex min-h-0 flex-col border-line md:border-r" aria-label="Entries">
            <div className="flex flex-col gap-2 border-b border-line bg-panel px-3 py-2">
              <div className="flex items-center gap-2">
                <input
                  id="search"
                  type="search"
                  className="field min-w-0 flex-1 font-mono"
                  placeholder="Filter by name"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <span className="tnum shrink-0 font-mono text-[12px] text-muted">
                  {visible.length === archive.entries.length
                    ? `${visible.length.toLocaleString()}`
                    : `${visible.length.toLocaleString()} / ${archive.entries.length.toLocaleString()}`}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {KIND_FILTERS.map((f) => {
                  const count = f.key === 'all' ? archive.entries.length : kindCounts[f.key]
                  return (
                    <button
                      key={f.key}
                      className={`chip ${kind === f.key ? 'chip-on' : ''}`}
                      onClick={() => setKind(f.key)}
                      disabled={count === 0 && f.key !== 'all'}
                    >
                      {f.key !== 'all' && (
                        <span className="inline-block size-2" style={{ background: KIND_COLORS[f.key] }} aria-hidden />
                      )}
                      {f.label}
                      <span className="tnum font-mono text-[11px] text-faint">{count.toLocaleString()}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <EntryList
              entries={visible}
              selected={selected}
              activeId={activeId}
              onSelectionChange={onSelectionChange}
              sort={sort}
              onSort={setSort}
              onDelete={() => remove(selectedEntries)}
              onRename={(entry) => setModal({ kind: 'rename', entry, value: entry.name })}
              onOpen={(entry) => extract([entry])}
            />
            <div className="flex h-10 shrink-0 items-center gap-2 border-t border-line bg-panel px-3 text-[12px]">
              {selectedEntries.length > 0 ? (
                <>
                  <span className="tnum text-muted">
                    {selectedEntries.length.toLocaleString()} selected,{' '}
                    {formatBytes(selectedEntries.reduce((n, e) => n + e.size, 0))}
                  </span>
                  <span className="grow" />
                  <div className="btn-group">
                    <button className="btn h-7" onClick={() => extract(selectedEntries)}>
                      {selectedEntries.length > 1 && hasDirectoryPicker ? 'Extract to folder' : 'Extract'}
                    </button>
                    {selectedEntries.length > 1 && hasDirectoryPicker && (
                      <button className="btn h-7" onClick={zipSelected}>
                        Zip
                      </button>
                    )}
                    <button className="btn btn-danger h-7" onClick={() => remove(selectedEntries)}>
                      Delete
                    </button>
                  </div>
                </>
              ) : (
                <span className="text-muted">
                  Click to select, <span className="kbd">Shift</span> for a range, <span className="kbd">Ctrl</span> to add. Drop files to add or replace.
                </span>
              )}
            </div>
          </section>
          <section className="flex min-h-0 flex-col" aria-label="Inspector">
            <Inspector
              archive={archive}
              entry={activeEntry}
              textureHelp={textureHelp}
              onExtract={(entry) => extract([entry])}
              onReplace={replace}
              onRename={(entry) => setModal({ kind: 'rename', entry, value: entry.name })}
              onDelete={(entry) => remove([entry])}
            />
          </section>
        </div>
      ) : (
        <EmptyState onOpen={open} />
      )}

      {archive && stats && (
        <div className="shrink-0 border-t border-line bg-panel px-3 pt-2 pb-2">
          <SectorMap
            archive={archive}
            selected={selected}
            activeId={activeId}
            onPick={(entry) => {
              setSelected(new Set([entry.id]))
              setActiveId(entry.id)
            }}
          />
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11.5px] text-muted">
            <span className="tnum">
              {formatBytes(archive.imgSize)} on disk, {Math.ceil(archive.imgSize / 2048).toLocaleString()} sectors of 2 KB
            </span>
            {stats.delta > 0 && <span className="tnum">saving reclaims {formatBytes(stats.delta)}</span>}
            {stats.delta < 0 && <span className="tnum">saving grows the archive by {formatBytes(-stats.delta)}</span>}
            <span className="grow" />
            {(Object.keys(KIND_LABELS) as Kind[]).map((k) =>
              kindCounts[k] ? (
                <span key={k} className="flex items-center gap-1.5">
                  <span className="inline-block size-2" style={{ background: KIND_COLORS[k] }} aria-hidden />
                  {KIND_LABELS[k]}
                </span>
              ) : null,
            )}
          </div>
        </div>
      )}

      <Footer />

      {dragging && (
        <div className="anim-fade-in fixed inset-0 z-30 grid place-items-center gap-4 bg-bg/80 p-6 backdrop-blur-[2px] md:grid-flow-col">
          <div data-drop="add" className="ants grid h-full min-h-40 w-full max-w-md place-items-center bg-panel px-10 py-8 text-center">
            <div className="pointer-events-none">
              <div className="text-[16px] font-semibold">{archive ? 'Add to archive' : 'Drop an .img archive'}</div>
              <div className="mt-1 text-muted">
                {archive
                  ? 'Files with an existing name replace that entry. Mod zips are opened for you.'
                  : 'For GTA III and Vice City, drop the .dir with it'}
              </div>
            </div>
          </div>
          {archive && activeEntry && (
            <div
              data-drop="replace"
              className="ants grid h-full min-h-40 w-full max-w-md place-items-center bg-panel px-10 py-8 text-center"
            >
              <div className="pointer-events-none">
                <div className="text-[16px] font-semibold">
                  Replace <span className="font-mono">{activeEntry.name}</span>
                </div>
                <div className="mt-1 text-muted">Whatever its file name, the dropped file becomes this entry's data.</div>
              </div>
            </div>
          )}
        </div>
      )}

      {busy && (
        <div className="anim-fade-in fixed inset-0 z-40 grid place-items-center bg-black/60 backdrop-blur-[2px]">
          <div className="anim-scale-in w-80 border border-line-strong bg-panel p-4">
            <div className="text-[13px] font-semibold">{busy.label}</div>
            <div className="mt-3 h-2 overflow-hidden border border-line bg-panel-2">
              <div className="stripes h-full" style={{ width: `${busy.total ? (busy.done / busy.total) * 100 : 0}%`, transition: 'width 120ms linear' }} />
            </div>
            <div className="tnum mt-1.5 font-mono text-[11.5px] text-muted">
              {busy.total > 10_000 ? `${formatBytes(busy.done)} of ${formatBytes(busy.total)}` : `${busy.done} of ${busy.total}`}
            </div>
          </div>
        </div>
      )}

      {modal?.kind === 'rename' && (
        <Modal
          title="Rename entry"
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={applyRename}>
                Rename
              </button>
            </>
          }
        >
          <label className="block text-[12px] text-muted" htmlFor="rename-input">
            New name, up to 23 characters, keep the extension
          </label>
          <input
            id="rename-input"
            className="field mt-1.5 w-full font-mono"
            value={modal.value}
            autoFocus
            maxLength={23}
            onChange={(e) => setModal({ ...modal, value: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && applyRename()}
          />
        </Modal>
      )}

      {modal?.kind === 'save-in-place' && archive && stats && (
        <Modal
          title={`Save ${archive.name}`}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="btn" onClick={saveAsDownload}>
                Download a copy instead
              </button>
              <button className="btn btn-primary" onClick={saveInPlace}>
                Overwrite
              </button>
            </>
          }
        >
          <p>
            This rewrites <span className="font-mono">{archive.name}</span>
            {archive.version === 1 ? ' and its .dir' : ''} on disk with {archive.entries.length.toLocaleString()} entries and no gaps
            ({formatBytes(stats.rebuiltSize)}).
          </p>
          <p className="mt-2 text-muted">Keep a backup of the original before overwriting a game archive.</p>
        </Modal>
      )}

      {modal?.kind === 'home' && (
        <Modal
          title="Close the archive"
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn" onClick={() => setModal(null)}>
                Keep editing
              </button>
              <button className="btn btn-primary" onClick={closeArchive}>
                Close without saving
              </button>
            </>
          }
        >
          <p>There are unsaved changes. Closing the archive drops every pending add, replace, rename and delete.</p>
        </Modal>
      )}

      {modal?.kind === 'discard' && (
        <Modal
          title="Discard changes"
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn" onClick={() => setModal(null)}>
                Keep editing
              </button>
              <button className="btn btn-primary" onClick={discard}>
                Discard
              </button>
            </>
          }
        >
          <p>Reload the archive as it is on disk and drop every pending add, replace, rename and delete.</p>
        </Modal>
      )}

      <Toasts toasts={toasts} dismiss={dismiss} />
    </div>
  )
}

function EmptyState({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="grid flex-1 place-items-center overflow-auto p-6">
      <div className="w-full max-w-2xl">
        <div className="anim-fade-up">
          <Brand size="lg" />
          <p className="mt-3 max-w-[52ch] text-[14px] text-muted">
            Open the archives of GTA III, Vice City and San Andreas, edit them, and look at every model and texture inside. Nothing leaves your machine.
          </p>
        </div>
        <button
          className="anim-fade-up delay-1 group mt-8 grid w-full place-items-center border border-dashed border-line-strong bg-panel px-6 py-14 text-center transition-colors hover:border-accent"
          onClick={onOpen}
        >
          <span
            className="grid size-10 place-items-center border border-line-strong text-muted transition-all duration-300 group-hover:-translate-y-1 group-hover:border-accent group-hover:text-accent"
            aria-hidden
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
              <path d="M12 4v12M6 10l6-6 6 6M4 20h16" />
            </svg>
          </span>
          <span className="mt-4 text-[17px] font-semibold">Drop gta3.img here, or click to open</span>
          <span className="mt-1.5 max-w-[46ch] text-muted">
            San Andreas archives are a single .img. GTA III and Vice City archives come as an .img with a .dir, drop both together.
          </span>
        </button>
        <dl className="anim-fade-up delay-2 mt-8 grid grid-cols-1 border border-line sm:grid-cols-2">
          {[
            ['Stays on your machine', 'Archives are read in place, even the 900 MB gta3.img of San Andreas.'],
            ['Edit and rebuild', 'Add, replace, rename and delete entries, then save a compact archive without gaps.'],
            ['See the models', 'DFF models open in 3D, characters standing, with textures found on their own. Export any texture as PNG.'],
            [
              'Write back in place',
              hasFileSystemAccess
                ? 'This browser can overwrite the archive directly.'
                : 'This browser downloads the rebuilt archive; Chrome and Edge can overwrite in place.',
            ],
          ].map(([title, body], i) => (
            <div key={title} className={`px-4 py-3 text-[12.5px] ${i % 2 ? 'sm:border-l sm:border-line' : ''} ${i >= 2 ? 'border-t border-line' : ''}`}>
              <dt className="font-semibold">{title}</dt>
              <dd className="mt-0.5 text-muted">{body}</dd>
            </div>
          ))}
        </dl>
        <p className="anim-fade-up delay-3 mt-4 text-[11.5px] text-faint">
          <span className="kbd">Ctrl</span> <span className="kbd">O</span> opens, <span className="kbd">Ctrl</span> <span className="kbd">S</span> saves.
        </p>
      </div>
    </div>
  )
}
