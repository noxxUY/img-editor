import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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
import {
  Download,
  FileArchive,
  FileBox,
  FilePlus2,
  FolderDown,
  FolderOpen,
  HardDrive,
  PanelRight,
  Replace,
  Save,
  Search,
  Trash2,
  TriangleAlert,
  Undo2,
  Upload,
} from 'lucide-react'
import { parseIde, type IdeMap } from './lib/ide'
import { buildTxdIndex, type TxdIndex } from './lib/txdIndex'
import { KIND_COLORS, KIND_LABELS, kindOf, type Kind } from './lib/kinds'
import { Meter, type TextureHelp } from './components/DffPreview'
import { Brand } from './components/Brand'
import { Horizon } from './components/Horizon'
import { Footer, GITHUB_REPO, GithubIcon } from './components/Footer'
import { Details } from './components/Details'
import { Appearance } from './components/Appearance'
import { PALETTES, applyPalette, currentPalette, type Palette } from './lib/theme'
import { detectGame } from './lib/game'
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
  // phones show either the list or the inspector
  const [mobilePane, setMobilePane] = useState<'list' | 'inspector'>('list')
  // below 1280px the details rail is a drawer
  const [detailsOpen, setDetailsOpen] = useState(false)
  // the game the open archive belongs to, read from the archive itself
  const [detected, setDetected] = useState<Palette | null>(null)
  // bumped by the logo on the start screen: scroll back up and replay the horizon
  const [homeTick, setHomeTick] = useState(0)
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
        setDetected(null)
        detectGame(opened)
          .then((game) => {
            if (!game) return
            setDetected(game)
            if (game !== currentPalette()) applyPalette(game, { sweep: true })
          })
          .catch(() => {})
        setSelected(new Set())
        setActiveId(null)
        setQuery('')
        setKind('all')
        setSort({ key: 'order', dir: 1 })
        setTxdIndex(null)
        setMobilePane('list')
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
    setMobilePane('list')
    setDetected(null)
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
    if (active !== null && sel.size === 1) setMobilePane('inspector')
  }, [])

  const kindCounts = useMemo(() => {
    const counts: Record<Kind, number> = { dff: 0, txd: 0, col: 0, ifp: 0, other: 0 }
    if (archive) for (const e of archive.entries) counts[kindOf(e.name)]++
    return counts
  }, [archive])

  const game = !archive
    ? ''
    : detected
      ? PALETTES.find((p) => p.key === detected)!.name
      : archive.version === 2
        ? 'San Andreas'
        : 'GTA III / Vice City'
  const addFromPicker = async () => addFiles(await expandZips(await pickFiles(true)))
  const multiToFolder = selectedEntries.length > 1 && hasDirectoryPicker

  return (
    <div className="flex h-full flex-col">
      <header className={`relative z-30 flex h-[52px] shrink-0 items-center gap-3 px-3 md:px-4 ${archive ? 'border-b border-line bg-panel' : 'bg-bg md:px-6'}`}>
        <Brand
          onClick={archive ? goHome : () => setHomeTick((n) => n + 1)}
          compact={!!archive}
          title={archive ? 'Close the archive and go back to the start' : 'Back to the top'}
        />
        {archive ? (
          <div className="flex min-w-0 flex-1 items-center">
            {/* the open archive, shown like a cartridge in a slot */}
            <div className="ml-1 flex h-8 min-w-0 items-center gap-2.5 border border-line-strong bg-bg pr-3 pl-2.5 sm:ml-3">
              <FileBox size={15} strokeWidth={1.75} className="hidden shrink-0 text-accent-fg sm:block" aria-hidden />
              <span className="truncate font-mono text-[12.5px] font-medium" title={archive.name}>
                {archive.name}
              </span>
              <span className="hidden shrink-0 font-mono text-[11px] text-muted lg:inline">
                v{archive.version} · {game} · {archive.entries.length.toLocaleString()}
              </span>
              {stats?.modified && (
                <span className="flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-accent-fg" title="Unsaved changes">
                  <span className="pulse-dot size-1.5 bg-accent" aria-hidden />
                  <span className="hidden md:inline">unsaved</span>
                  <span className="sr-only md:hidden">Unsaved changes</span>
                </span>
              )}
            </div>
          </div>
        ) : (
          <span className="flex-1" />
        )}
        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
          {archive ? (
            <>
              <button className="btn btn-ghost btn-icon md:w-auto md:px-3" onClick={open} title="Open another archive (Ctrl O)" aria-label="Open another archive">
                <FolderOpen size={16} strokeWidth={1.75} aria-hidden />
                <span className="hidden md:inline">Open</span>
              </button>
              <button
                className="btn btn-ghost btn-icon md:w-auto md:px-3"
                onClick={addFromPicker}
                title="Files with a name that already exists replace that entry. Zips are opened."
                aria-label="Add files"
              >
                <FilePlus2 size={16} strokeWidth={1.75} aria-hidden />
                <span className="hidden md:inline">Add files</span>
              </button>
              <Menu
                primary={!!stats?.modified}
                button={
                  <>
                    <Save size={15} strokeWidth={1.75} aria-hidden />
                    Save
                  </>
                }
                items={[
                  {
                    label: `Overwrite ${archive.name}`,
                    icon: <HardDrive size={15} strokeWidth={1.75} />,
                    hint: canSaveInPlace
                      ? 'Rewrites the file on disk in place, without gaps.'
                      : 'Needs Chrome or Edge and the archive opened with the Open button or dropped from Explorer.',
                    shortcut: 'Ctrl S',
                    disabled: !canSaveInPlace,
                    onSelect: () => setModal({ kind: 'save-in-place' }),
                  },
                  {
                    label: 'Save a copy to a folder…',
                    icon: <FolderDown size={15} strokeWidth={1.75} />,
                    hint: hasDirectoryPicker
                      ? `Writes ${archive.name}${archive.version === 1 ? ' and its .dir' : ''} where you choose. The original stays untouched.`
                      : 'Not available in this browser; use Download instead.',
                    disabled: !hasDirectoryPicker,
                    onSelect: () => void saveCopyToFolder(),
                  },
                  {
                    label: 'Download rebuilt archive',
                    icon: <Download size={15} strokeWidth={1.75} />,
                    hint: 'Goes to your downloads folder. Works in every browser.',
                    onSelect: saveAsDownload,
                  },
                  ...(stats?.modified
                    ? [
                        {
                          label: 'Discard changes…',
                          icon: <Undo2 size={15} strokeWidth={1.75} />,
                          hint: 'Reload the archive as it is on disk.',
                          onSelect: () => setModal({ kind: 'discard' }),
                        },
                      ]
                    : []),
                ]}
              />
              <button
                className="btn btn-ghost btn-icon hidden md:inline-flex xl:hidden"
                onClick={() => setDetailsOpen((o) => !o)}
                aria-pressed={detailsOpen}
                aria-label="Details"
                title="Details"
              >
                <PanelRight size={16} strokeWidth={1.75} />
              </button>
            </>
          ) : (
            <>
              <nav className="mr-2 hidden items-center gap-1 md:flex" aria-label="Sections">
                <a className="btn btn-ghost" href="#how">
                  How it works
                </a>
                <a className="btn btn-ghost" href="#games">
                  Games
                </a>
                <a className="btn btn-ghost" href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
                  <GithubIcon />
                  Source
                </a>
              </nav>
              <button className="btn btn-primary btn-sm" onClick={open}>
                Open an archive
              </button>
            </>
          )}
          <Appearance />
        </div>
      </header>

      {archive && stats ? (
        <div className="relative grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(290px,340px)_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)_288px]">
          <section
            className={`min-h-0 flex-col border-line bg-panel md:flex md:border-r ${mobilePane === 'inspector' ? 'hidden' : 'flex'}`}
            aria-label="Entries"
          >
            <div className="flex flex-col gap-3 border-b border-line p-3">
              <div className="relative">
                <Search size={15} strokeWidth={1.75} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-faint" aria-hidden />
                <input
                  id="search"
                  type="search"
                  className="field h-9 w-full pr-3 pl-8 font-mono text-[12.5px]"
                  placeholder="Find an entry, e.g. cesar"
                  aria-label="Filter entries by name"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-px border border-line bg-line" role="group" aria-label="Entry type">
                {KIND_FILTERS.map((f) => {
                  const count = f.key === 'all' ? archive.entries.length : kindCounts[f.key]
                  const on = kind === f.key
                  return (
                    <button
                      key={f.key}
                      className={`flex cursor-pointer flex-col items-start gap-0.5 px-2.5 py-1.5 text-left transition-colors duration-100 disabled:cursor-default disabled:opacity-35 ${
                        on ? 'bg-panel-3 text-text' : 'bg-panel text-muted hover:bg-panel-2 hover:text-text'
                      }`}
                      aria-pressed={on}
                      onClick={() => setKind(f.key)}
                      disabled={count === 0 && f.key !== 'all'}
                    >
                      <span className="flex items-center gap-1.5 text-[12.5px] font-medium">
                        <span
                          className="swatch"
                          style={{ background: f.key === 'all' ? 'var(--text)' : KIND_COLORS[f.key] }}
                          aria-hidden
                        />
                        {f.label}
                      </span>
                      <span className={`tnum font-mono text-[11px] ${on ? 'text-accent-fg' : 'text-faint'}`}>{count.toLocaleString()}</span>
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
            {selectedEntries.length > 1 ? (
              <div className="anim-slide-in flex min-h-12 shrink-0 items-center gap-2 border-t border-line-strong bg-panel-2 px-3 py-2 text-[12.5px]">
                <span className="tnum min-w-0 flex-1 truncate">
                  <span className="font-semibold">{selectedEntries.length.toLocaleString()} selected</span>
                  <span className="text-muted"> · {formatBytes(selectedEntries.reduce((n, e) => n + e.size, 0))}</span>
                </span>
                <div className="btn-group">
                  <button className="btn btn-sm" onClick={() => extract(selectedEntries)}>
                    <Download size={14} strokeWidth={1.75} aria-hidden />
                    {multiToFolder ? 'To folder' : 'Extract'}
                  </button>
                  {multiToFolder && (
                    <button className="btn btn-sm" onClick={zipSelected}>
                      <FileArchive size={14} strokeWidth={1.75} aria-hidden />
                      Zip
                    </button>
                  )}
                </div>
                <button
                  className="btn btn-sm btn-danger btn-icon"
                  onClick={() => remove(selectedEntries)}
                  aria-label={`Delete ${selectedEntries.length} selected`}
                  title="Delete (Del)"
                >
                  <Trash2 size={14} strokeWidth={1.75} />
                </button>
              </div>
            ) : (
              <p className="hidden shrink-0 border-t border-line px-3 py-2.5 text-[12px] text-faint md:block">
                <span className="kbd">Shift</span> selects a range, <span className="kbd">Ctrl</span> adds one. Drop files to add or replace.
              </p>
            )}
          </section>

          <section className={`min-h-0 flex-col md:flex ${mobilePane === 'list' ? 'hidden' : 'flex'}`} aria-label="Stage">
            <Inspector
              archive={archive}
              entry={activeEntry}
              textureHelp={textureHelp}
              onExtract={(entry) => extract([entry])}
              onReplace={replace}
              onRename={(entry) => setModal({ kind: 'rename', entry, value: entry.name })}
              onDelete={(entry) => remove([entry])}
              onBack={() => setMobilePane('list')}
            />
          </section>

          <div
            className={`min-h-0 xl:static xl:flex xl:flex-col ${
              detailsOpen
                ? 'anim-slide-in absolute inset-y-0 right-0 z-20 hidden w-[300px] shadow-[-24px_0_48px_-24px_rgb(0_0_0/0.5)] md:flex md:flex-col xl:w-auto xl:shadow-none'
                : 'hidden'
            }`}
          >
            <Details
              archive={archive}
              game={game}
              stats={stats}
              entry={activeEntry}
              ideMap={ideMap}
              txdIndex={txdIndex}
              indexing={indexing}
              onLoadIde={() => void textureHelp.onLoadIde()}
              onBuildIndex={() => void buildIndex()}
            />
          </div>
        </div>
      ) : (
        <Landing onOpen={open} replay={homeTick} />
      )}

      {archive && stats && (
        <footer className="flex shrink-0 items-center gap-3 border-t border-line bg-panel px-3 py-2 md:px-4">
          <span className="label hidden shrink-0 sm:block">Sectors</span>
          <div className="min-w-0 flex-1">
            <SectorMap
              archive={archive}
              selected={selected}
              activeId={activeId}
              onPick={(entry) => {
                setSelected(new Set([entry.id]))
                setActiveId(entry.id)
                setMobilePane('inspector')
              }}
            />
          </div>
          <span className="tnum hidden shrink-0 font-mono text-[11.5px] text-muted md:block">
            {formatBytes(archive.imgSize)} · {Math.ceil(archive.imgSize / 2048).toLocaleString()} × 2 KB
          </span>
          <span className="hidden shrink-0 items-center gap-3 text-[11.5px] text-muted 2xl:flex">
            {(Object.keys(KIND_LABELS) as Kind[]).map((k) =>
              kindCounts[k] ? (
                <span key={k} className="flex items-center gap-1.5">
                  <span className="swatch" style={{ background: KIND_COLORS[k] }} aria-hidden />
                  {KIND_LABELS[k]}
                </span>
              ) : null,
            )}
          </span>
        </footer>
      )}

      {dragging && (
        <div className="anim-fade-in fixed inset-0 z-50 grid place-items-center gap-4 bg-bg/85 p-6 backdrop-blur-sm md:grid-flow-col">
          <div data-drop="add" className="ants grid h-full max-h-80 min-h-40 w-full max-w-md place-items-center bg-panel px-10 py-8 text-center">
            <div className="pointer-events-none flex flex-col items-center">
              <Upload size={24} strokeWidth={1.5} className="text-accent-fg" aria-hidden />
              <div className="mt-4 font-display text-[19px] font-semibold tracking-[-0.01em]">
                {archive ? 'Add to archive' : 'Drop an .img archive'}
              </div>
              <div className="mt-1.5 max-w-[34ch] text-pretty text-muted">
                {archive
                  ? 'Files with an existing name replace that entry. Mod zips are opened for you.'
                  : 'For GTA III and Vice City, drop the .dir with it.'}
              </div>
            </div>
          </div>
          {archive && activeEntry && (
            <div data-drop="replace" className="ants grid h-full max-h-80 min-h-40 w-full max-w-md place-items-center bg-panel px-10 py-8 text-center">
              <div className="pointer-events-none flex flex-col items-center">
                <Replace size={24} strokeWidth={1.5} className="text-accent-2" aria-hidden />
                <div className="mt-4 font-display text-[19px] font-semibold tracking-[-0.01em]">
                  Replace <span className="font-mono text-[17px] font-medium">{activeEntry.name}</span>
                </div>
                <div className="mt-1.5 max-w-[34ch] text-pretty text-muted">Whatever its file name, the dropped file becomes this entry’s data.</div>
              </div>
            </div>
          )}
        </div>
      )}

      {busy && (
        <div className="anim-fade-in fixed inset-0 z-50 grid place-items-center bg-[rgb(0_0_0/0.55)] p-4" role="alertdialog" aria-label={busy.label}>
          <div className="anim-pop w-full max-w-[360px] border border-line-strong bg-panel p-5 shadow-[0_24px_64px_-16px_rgb(0_0_0/0.6)]">
            <div className="flex items-center gap-2.5 text-[14px] font-semibold">
              <span className="spinner" aria-hidden />
              <span className="truncate">{busy.label}</span>
            </div>
            <Meter value={busy.total ? busy.done / busy.total : 0} segments={32} className="mt-4 h-2 w-full" />
            <div className="tnum mt-2 flex justify-between font-mono text-[11.5px] text-muted">
              <span>{busy.total > 10_000 ? `${formatBytes(busy.done)} of ${formatBytes(busy.total)}` : `${busy.done} of ${busy.total}`}</span>
              <span>{busy.total ? Math.floor((busy.done / busy.total) * 100) : 0}%</span>
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
          <label className="block text-[12.5px] text-muted" htmlFor="rename-input">
            New name, up to 23 characters. Keep the extension.
          </label>
          <div className="relative mt-2">
            <input
              id="rename-input"
              className="field h-9 w-full pr-14 font-mono"
              value={modal.value}
              autoFocus
              maxLength={23}
              onChange={(e) => setModal({ ...modal, value: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && applyRename()}
            />
            <span className="tnum pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 font-mono text-[11px] text-faint">
              {modal.value.length}/23
            </span>
          </div>
        </Modal>
      )}

      {modal?.kind === 'save-in-place' && archive && stats && (
        <Modal
          title={`Overwrite ${archive.name}?`}
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
            {archive.version === 1 ? ' and its .dir' : ''} on disk with {archive.entries.length.toLocaleString()} entries and no gaps (
            {formatBytes(stats.rebuiltSize)}).
          </p>
          <p className="mt-3 flex gap-2 border border-warn/40 bg-warn/10 px-3 py-2 text-[12.5px]">
            <TriangleAlert size={15} strokeWidth={1.75} className="mt-px shrink-0 text-warn" aria-hidden />
            Keep a backup of the original before overwriting a game archive.
          </p>
        </Modal>
      )}

      {modal?.kind === 'home' && (
        <Modal
          title="Close the archive?"
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn" onClick={() => setModal(null)}>
                Keep editing
              </button>
              <button className="btn btn-destructive" onClick={closeArchive}>
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
          title="Discard all changes?"
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn" onClick={() => setModal(null)}>
                Keep editing
              </button>
              <button className="btn btn-destructive" onClick={discard}>
                Discard changes
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

const STEPS: [string, string][] = [
  ['Drop the archive', 'gta3.img from the game’s models folder, with gta3.dir for GTA III and Vice City. It is read in place, even at 900 MB.'],
  ['Find and look', 'Filter thousands of entries by name or type. Models open in 3D with their textures; texture dictionaries export as PNG.'],
  ['Swap and save', 'Add, replace, rename and delete, then overwrite the archive or download a rebuilt copy.'],
]

const GAME_CARDS: Record<Palette, { format: string; files: string; card: string }> = {
  iii: { format: 'IMG v1', files: 'gta3.img + gta3.dir', card: '#14171b' },
  vc: { format: 'IMG v1', files: 'gta3.img + gta3.dir', card: '#1b1240' },
  sa: { format: 'IMG v2', files: 'gta3.img', card: '#221a10' },
}

// an illustrative archive layout: entries of each kind, with the gaps edits leave behind
const LAYOUT: { kind: Kind; w: number; gap?: number }[] = Array.from({ length: 26 }, (_, i) => ({
  kind: (['dff', 'dff', 'dff', 'txd', 'col', 'ifp', 'dff', 'txd'] as Kind[])[(i * 5) % 8],
  w: 1 + ((i * 7) % 5),
  gap: i % 4 === 3 ? 2 + (i % 3) : undefined,
}))

function SectionTitle({ id, title, children }: { id?: string; title: string; children?: ReactNode }) {
  return (
    <div id={id} className="reveal scroll-mt-8">
      <h2 className="font-display text-[clamp(32px,4vw,48px)] leading-[1.05] font-bold tracking-[-0.03em] text-balance">{title}</h2>
      {children && <p className="mt-3.5 max-w-[52ch] text-[17px] leading-relaxed text-pretty text-muted">{children}</p>}
    </div>
  )
}

/** The start screen: the detected game's horizon under the headline, then how it works. */
function Landing({ onOpen, replay }: { onOpen: () => void; replay: number }) {
  const main = useRef<HTMLElement>(null)
  useEffect(() => {
    if (replay) main.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [replay])
  return (
    <main ref={main} className="anim-fade-in relative min-h-0 flex-1 overflow-y-auto scroll-smooth">
      <section className="relative">
        <div className="sky-bands relative overflow-hidden border-b-[3px] border-accent-2">
          <div className="flex flex-col items-center gap-6 px-5 pt-[clamp(40px,8vh,88px)] pb-[clamp(48px,7vh,80px)] text-center">
            <h1 className="anim-rise max-w-[16ch] font-display text-[clamp(44px,6.4vw,88px)] leading-[0.98] font-bold tracking-[-0.03em] text-balance">
              Your GTA archives, opened in the browser.
            </h1>
            <p className="anim-rise delay-1 max-w-[50ch] text-[17px] leading-relaxed text-pretty text-muted md:text-[18px]">
              Browse, extract, replace and rebuild <span className="font-mono text-[15.5px] text-text">gta3.img</span> for GTA III, Vice City and San
              Andreas. Every model opens in 3D with its textures, and nothing is uploaded.
            </p>
            <div className="anim-rise delay-2 flex flex-wrap items-center justify-center gap-3">
              <button className="btn btn-primary btn-lg" onClick={onOpen}>
                <FolderOpen size={18} strokeWidth={1.75} aria-hidden />
                Open an archive
              </button>
              <a className="btn btn-lg border-line-strong bg-bg/50 font-medium" href="#how">
                See how it works
              </a>
            </div>
            <span className="anim-rise delay-3 font-mono text-[13px] text-muted">
              or drop gta3.img anywhere<span className="hidden sm:inline"> · Ctrl O</span>
            </span>
          </div>
          <Horizon replay={replay} />
        </div>

        <div className="sea-fade px-5 pb-10 md:px-8">
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 pt-28 md:px-8">
        <SectionTitle id="how" title="From the game folder and back." />
        <ol className="reveal mt-10 grid gap-px border border-line bg-line sm:grid-cols-3">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="flex flex-col gap-2.5 bg-bg px-7 pt-7 pb-8">
              <span className="font-mono text-[13px] text-accent-2">{i + 1}</span>
              <h3 className="font-display text-[22px] font-bold tracking-[-0.02em]">{title}</h3>
              <p className="text-[15px] leading-relaxed text-pretty text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-12 px-5 pt-28 md:px-8">
        <div className="flex-[1_1_380px]">
          <SectionTitle title="Rebuilt without gaps.">
            Every replace and delete leaves holes in an IMG archive. Saving writes a compact one, sector by sector, and Chrome and Edge overwrite the file
            on disk in place.
          </SectionTitle>
        </div>
        <div className="flex flex-[1_1_480px] flex-col gap-3" aria-hidden>
          <div className="reveal-grow flex h-7 gap-0.5">
            {LAYOUT.flatMap((b, i) => [
              <div key={i} style={{ flex: b.w, background: KIND_COLORS[b.kind] }} />,
              ...(b.gap ? [<div key={`g${i}`} className="bg-panel-3" style={{ flex: b.gap }} />] : []),
            ])}
          </div>
          <span className="font-mono text-[12px] text-muted">before · with gaps</span>
          <div className="reveal-compact mt-3 flex h-7 gap-0.5">
            {LAYOUT.map((b, i) => (
              <div key={i} style={{ flex: b.w, background: KIND_COLORS[b.kind] }} />
            ))}
            <div style={{ flex: 12 }} />
          </div>
          <span className="font-mono text-[12px] text-accent-2">after saving · compact</span>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 pt-28 md:px-8">
        <SectionTitle id="games" title="The game is recognized for you.">
          Drop the archive and the editor reads which game it belongs to, then dresses itself in that game’s colors.
        </SectionTitle>
        <ul className="reveal mt-10 grid gap-4 sm:grid-cols-3">
          {PALETTES.map((p) => {
            const g = GAME_CARDS[p.key]
            return (
              <li
                key={p.key}
                className="group flex min-h-[200px] flex-col border border-white/10 transition-[translate,box-shadow] duration-300 ease-out hover:-translate-y-1 motion-reduce:hover:translate-y-0"
                style={{ background: g.card, color: p.text }}
              >
                <span className="px-5 pt-5 font-mono text-[12px]" style={{ color: p.muted }}>
                  {p.year} · {g.format}
                </span>
                <span className="mt-auto px-5 font-display text-[30px] font-bold tracking-[-0.03em]">{p.name}</span>
                <span className="px-5 pt-2 pb-5 font-mono text-[13px]" style={{ color: p.muted }}>
                  {g.files}
                </span>
                <span className="flex h-1.5 transition-[height] duration-300 ease-out group-hover:h-2.5" aria-hidden>
                  <span className="flex-[3]" style={{ background: p.swatches[1] }} />
                  <span className="flex-1" style={{ background: p.swatches[2] }} />
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="mt-36" aria-labelledby="cta-title">
        <div className="sky-bands h-56 border-b-[3px] border-accent-2" aria-hidden />
        <div className="sea-fade">
          <div className="reveal mx-auto flex max-w-[1200px] flex-wrap items-center gap-8 px-5 pt-16 pb-[72px] md:px-8">
            <div className="flex-[1_1_360px]">
              <h2 id="cta-title" className="font-display text-[clamp(32px,4vw,52px)] leading-none font-bold tracking-[-0.03em]">
                Drop your gta3.img.
              </h2>
              <p className="mt-2.5 text-[16px] text-muted">GTA III and Vice City need gta3.dir with it.</p>
            </div>
            <button className="btn btn-primary btn-lg" onClick={onOpen}>
              <FolderOpen size={18} strokeWidth={1.75} aria-hidden />
              Open an archive
            </button>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
