import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Box, Download, PenLine, Replace, Trash2 } from 'lucide-react'
import { entryBytes, type ImgArchive, type ImgEntry } from '../lib/img/archive'
import { SECTOR } from '../lib/img/format'
import { detectKind, formatBytes, hexDump, ifpInfo, listColModels, type FileKind } from '../lib/detect'
import { KIND_COLORS, KIND_LABELS, kindOf } from '../lib/kinds'
import type { TextureHelp } from './DffPreview'
import { TxdPreview } from './TxdPreview'

const DffPreview = lazy(() => import('./DffPreview').then((m) => ({ default: m.DffPreview })))

interface Props {
  archive: ImgArchive
  entry: ImgEntry | null
  textureHelp: TextureHelp
  onExtract: (entry: ImgEntry) => void
  onReplace: (entry: ImgEntry) => void
  onRename: (entry: ImgEntry) => void
  onDelete: (entry: ImgEntry) => void
  onBack?: () => void
}

const latin1 = new TextDecoder('latin1')

const SHORTCUTS: [string[], string][] = [
  [['↑', '↓'], 'Move through the list'],
  [['Shift'], 'Select a range'],
  [['Ctrl', 'A'], 'Select everything shown'],
  [['Enter'], 'Extract the entry'],
  [['F2'], 'Rename'],
  [['Del'], 'Delete the selection'],
]

export function Inspector({ archive, entry, textureHelp, onExtract, onReplace, onRename, onDelete, onBack }: Props) {
  const [loaded, setLoaded] = useState<{ id: number; bytes: Uint8Array; kind: FileKind } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!entry) {
      setLoaded(null)
      return
    }
    let cancelled = false
    setError(null)
    entryBytes(archive, entry)
      .then((bytes) => {
        if (cancelled) return
        setLoaded({ id: entry.id, bytes, kind: detectKind(entry.name, bytes.subarray(0, 64)) })
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [archive, entry])

  const body = useMemo(() => {
    if (!entry || !loaded || loaded.id !== entry.id) return null
    const { bytes, kind } = loaded
    switch (kind) {
      case 'dff':
        return (
          <Suspense
            fallback={
              <div className="sky flex flex-1 items-center justify-center gap-2 text-muted">
                <span className="spinner" aria-hidden />
                Loading the 3D viewer…
              </div>
            }
          >
            <DffPreview key={entry.id} archive={archive} entry={entry} bytes={bytes} help={textureHelp} />
          </Suspense>
        )
      case 'txd':
        return <TxdPreview key={entry.id} bytes={bytes} entryName={entry.name} />
      case 'col': {
        const models = listColModels(bytes)
        return (
          <div className="min-h-0 flex-1 overflow-auto">
            <div className="border-b border-line px-5 py-2.5 text-[12.5px] text-muted">
              {models.length} collision model{models.length === 1 ? '' : 's'} in this file
            </div>
            <table className="w-full border-collapse text-[13px]">
              <thead className="sticky top-0 bg-panel text-left">
                <tr className="border-b border-line">
                  <th className="label px-5 py-2 font-medium">Model</th>
                  <th className="label px-2 py-2 font-medium">Version</th>
                  <th className="label px-2 py-2 text-right font-medium">Model id</th>
                  <th className="label px-5 py-2 text-right font-medium">Size</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m, i) => (
                  <tr key={i} className="border-b border-line/60 transition-colors duration-100 hover:bg-panel-2/60">
                    <td className="px-5 py-1.5 font-mono text-[12.5px]">{m.name}</td>
                    <td className="px-2 py-1.5">{m.version}</td>
                    <td className="tnum px-2 py-1.5 text-right font-mono text-[12.5px] text-muted">{m.modelId}</td>
                    <td className="tnum px-5 py-1.5 text-right font-mono text-[12.5px] text-muted">{formatBytes(m.size)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      case 'ifp': {
        const info = ifpInfo(bytes)
        return (
          <div className="min-h-0 flex-1 overflow-auto p-5 text-[13px]">
            <div className="label">Animation package</div>
            {info ? (
              <div className="mt-2 flex flex-col gap-0.5">
                <span className="font-mono text-[15px] font-medium">{info.name}</span>
                <span className="text-muted">Format {info.version}</span>
              </div>
            ) : (
              <div className="mt-2">Unknown animation format</div>
            )}
            <div className="label mt-6">First bytes</div>
            <pre className="mt-2 overflow-auto border border-line bg-panel p-3 font-mono text-[11.5px] leading-[17px] text-muted">
              {hexDump(bytes, 256)}
            </pre>
          </div>
        )
      }
      case 'empty':
        return (
          <div className="max-w-[60ch] p-5 text-[13px] leading-relaxed text-muted">
            This entry is empty: the directory lists it with a size of 0 sectors. GTA III ships a few of these; the game ignores them and so does a rebuild.
          </div>
        )
      case 'text':
        return (
          <pre className="min-h-0 flex-1 overflow-auto p-5 font-mono text-[12.5px] leading-[19px] whitespace-pre">
            {latin1.decode(bytes.subarray(0, 256 * 1024))}
            {bytes.length > 256 * 1024 && '\n… (truncated)'}
          </pre>
        )
      default:
        return (
          <div className="min-h-0 flex-1 overflow-auto p-5">
            <div className="mb-3 text-[13px] text-muted">There is no preview for this file type. These are its first bytes:</div>
            <pre className="overflow-auto border border-line bg-panel p-3 font-mono text-[11.5px] leading-[17px]">{hexDump(bytes, 1024)}</pre>
          </div>
        )
    }
  }, [archive, entry, loaded, textureHelp])

  if (!entry) {
    return (
      <div className="sky grid flex-1 place-items-center overflow-auto p-8">
        <div className="anim-fade-in flex max-w-[380px] flex-col items-center text-center">
          <span className="grid size-12 place-items-center border border-line-strong bg-panel text-accent-fg" aria-hidden>
            <Box size={22} strokeWidth={1.5} />
          </span>
          <h2 className="mt-5 font-display text-[20px] font-semibold tracking-[-0.01em]">Pick an entry</h2>
          <p className="mt-1.5 text-[13.5px] text-pretty text-muted">
            Models open in 3D with their textures, texture dictionaries show every texture, collisions list their models.
          </p>
          <dl className="mt-6 grid w-full grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-line pt-5 text-left text-[12.5px]">
            {SHORTCUTS.map(([keys, text]) => (
              <div key={text} className="contents">
                <dt className="flex gap-1">
                  {keys.map((k) => (
                    <span key={k} className="kbd">
                      {k}
                    </span>
                  ))}
                </dt>
                <dd className="text-muted">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    )
  }

  const kind = kindOf(entry.name)
  const sectors = Math.ceil(entry.size / SECTOR)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div key={`head-${entry.id}`} className="anim-fade-in border-b border-line bg-panel px-4 py-3.5 md:px-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
          {onBack && (
            <button className="btn btn-ghost btn-icon btn-sm -ml-1.5 md:hidden" onClick={onBack} aria-label="Back to the list">
              <ArrowLeft size={16} strokeWidth={1.75} />
            </button>
          )}
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className="size-2.5 shrink-0" style={{ background: KIND_COLORS[kind] }} title={KIND_LABELS[kind]} aria-hidden />
            <h2 className="min-w-0 truncate font-mono text-[20px] leading-[26px] font-semibold tracking-[-0.02em]" title={entry.name}>
              <span className="sr-only">{KIND_LABELS[kind]}: </span>
              {entry.name}
            </h2>
            {entry.status !== 'original' && (
              <span className="shrink-0 border border-accent/50 bg-selection px-1.5 font-mono text-[10.5px] leading-[17px] font-medium text-accent-fg">
                {entry.status === 'added' ? 'new' : entry.status}
                {entry.originalName && entry.originalName !== entry.name ? `, was ${entry.originalName}` : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="btn-group">
              <button className="btn btn-sm" onClick={() => onExtract(entry)} title="Extract (Enter)" aria-label={`Extract ${entry.name}`}>
                <Download size={14} strokeWidth={1.75} aria-hidden />
                <span className="hidden sm:inline">Extract</span>
              </button>
              <button className="btn btn-sm" onClick={() => onReplace(entry)} title="Replace with a file" aria-label={`Replace ${entry.name} with a file`}>
                <Replace size={14} strokeWidth={1.75} aria-hidden />
                <span className="hidden sm:inline">Replace</span>
              </button>
              <button className="btn btn-sm" onClick={() => onRename(entry)} title="Rename (F2)" aria-label={`Rename ${entry.name}`}>
                <PenLine size={14} strokeWidth={1.75} aria-hidden />
                <span className="hidden sm:inline">Rename</span>
              </button>
            </div>
            <button className="btn btn-sm btn-danger btn-icon" onClick={() => onDelete(entry)} aria-label={`Delete ${entry.name}`} title="Delete (Del)">
              <Trash2 size={14} strokeWidth={1.75} />
            </button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-[11.5px] text-muted xl:hidden">
          <span className="tnum">
            {formatBytes(entry.size)} <span className="text-faint">·</span> {entry.size.toLocaleString()} bytes{' '}
            <span className="text-faint">·</span> {sectors.toLocaleString()} sector{sectors === 1 ? '' : 's'}
          </span>
          {entry.source.kind === 'archive' ? (
            <span className="tnum">
              offset 0x{entry.source.offset.toString(16).toUpperCase()} <span className="text-faint">·</span> sector{' '}
              {(entry.source.offset / SECTOR).toLocaleString()}
            </span>
          ) : (
            <span className="text-accent-fg">not written yet, goes in with the next save</span>
          )}
        </div>
      </div>
      {error ? (
        <div className="p-5 text-danger">Could not read this entry: {error}</div>
      ) : body ? (
        <div key={`body-${entry.id}`} className="anim-fade-in flex min-h-0 flex-1 flex-col">
          {body}
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-2 p-5" aria-label="Loading">
          <div className="shimmer h-7 w-2/3" />
          <div className="shimmer min-h-40 w-full flex-1" />
          <div className="shimmer h-10 w-full" />
        </div>
      )}
    </div>
  )
}
