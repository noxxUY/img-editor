import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { entryBytes, type ImgArchive, type ImgEntry } from '../lib/img/archive'
import { SECTOR } from '../lib/img/format'
import { detectKind, formatBytes, hexDump, ifpInfo, listColModels, type FileKind } from '../lib/detect'
import { KIND_COLORS, KIND_LABELS, kindOf } from '../lib/kinds'
import type { TextureHelp } from './DffPreview'
import { TxdPreview } from './TxdPreview'

// three.js is only needed for models, so it loads on first use
const DffPreview = lazy(() => import('./DffPreview').then((m) => ({ default: m.DffPreview })))

interface Props {
  archive: ImgArchive
  entry: ImgEntry | null
  textureHelp: TextureHelp
  onExtract: (entry: ImgEntry) => void
  onReplace: (entry: ImgEntry) => void
  onRename: (entry: ImgEntry) => void
  onDelete: (entry: ImgEntry) => void
}

const latin1 = new TextDecoder('latin1')

export function Inspector({ archive, entry, textureHelp, onExtract, onReplace, onRename, onDelete }: Props) {
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
          <Suspense fallback={<div className="p-4 text-muted">Loading the 3D viewer…</div>}>
            <DffPreview key={entry.id} archive={archive} entry={entry} bytes={bytes} help={textureHelp} />
          </Suspense>
        )
      case 'txd':
        return <TxdPreview key={entry.id} bytes={bytes} entryName={entry.name} />
      case 'col': {
        const models = listColModels(bytes)
        return (
          <div className="min-h-0 flex-1 overflow-auto">
            <div className="border-b border-line px-4 py-2 text-[12px] text-muted">
              {models.length} collision model{models.length === 1 ? '' : 's'} in this file
            </div>
            <table className="w-full border-collapse text-[12px]">
              <thead className="text-left text-muted">
                <tr className="border-b border-line">
                  <th className="px-4 py-1.5 font-semibold">Model</th>
                  <th className="px-2 py-1.5 font-semibold">Version</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Model id</th>
                  <th className="px-4 py-1.5 text-right font-semibold">Size</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m, i) => (
                  <tr key={i} className="border-b border-line/70">
                    <td className="px-4 py-1 font-mono">{m.name}</td>
                    <td className="px-2 py-1">{m.version}</td>
                    <td className="tnum px-2 py-1 text-right font-mono">{m.modelId}</td>
                    <td className="tnum px-4 py-1 text-right font-mono">{formatBytes(m.size)}</td>
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
          <div className="p-4 text-[12.5px]">
            <div className="text-muted">Animation package</div>
            {info ? (
              <>
                <div className="mt-1">Format {info.version}</div>
                <div className="font-mono">{info.name}</div>
              </>
            ) : (
              <div className="mt-1">Unknown animation format</div>
            )}
            <pre className="mt-4 overflow-auto font-mono text-[11px] leading-[16px] text-muted">{hexDump(bytes, 256)}</pre>
          </div>
        )
      }
      case 'empty':
        return (
          <div className="p-4 text-[12.5px] text-muted">
            This entry is empty: the directory lists it with a size of 0 sectors. GTA III ships a few of these; the game ignores them and so does a rebuild.
          </div>
        )
      case 'text':
        return (
          <pre className="min-h-0 flex-1 overflow-auto p-4 font-mono text-[12px] leading-[18px] whitespace-pre">
            {latin1.decode(bytes.subarray(0, 256 * 1024))}
            {bytes.length > 256 * 1024 && '\n… (truncated)'}
          </pre>
        )
      default:
        return (
          <div className="min-h-0 flex-1 overflow-auto p-4">
            <div className="mb-2 text-[12px] text-muted">No preview for this file type. First bytes:</div>
            <pre className="font-mono text-[11px] leading-[16px]">{hexDump(bytes, 1024)}</pre>
          </div>
        )
    }
  }, [archive, entry, loaded, textureHelp])

  if (!entry) {
    return (
      <div className="anim-fade-in grid flex-1 place-items-center p-8 text-center text-muted">
        <div>
          <div className="mx-auto mb-4 grid size-10 place-items-center border border-line-strong text-faint" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter">
              <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12L4 7.5" />
            </svg>
          </div>
          <div className="text-[15px] font-semibold text-text">Nothing selected</div>
          <div className="mt-1 max-w-[36ch]">
            Pick an entry on the left to inspect it. Models open in 3D, texture dictionaries show every texture.
          </div>
        </div>
      </div>
    )
  }

  const kind = kindOf(entry.name)
  const sectors = Math.ceil(entry.size / SECTOR)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div key={`head-${entry.id}`} className="anim-fade-in border-b border-line bg-panel px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-block size-2.5 shrink-0" style={{ background: KIND_COLORS[kind] }} aria-hidden />
          <h2 className="min-w-0 truncate font-mono text-[15px] font-medium" title={entry.name}>
            {entry.name}
          </h2>
          {entry.status !== 'original' && (
            <span className="border border-accent px-1.5 py-0.5 text-[11px] font-medium text-accent">
              {entry.status === 'added' ? 'new' : entry.status}
              {entry.originalName && entry.originalName !== entry.name ? ` (was ${entry.originalName})` : ''}
            </span>
          )}
          <span className="grow" />
          <div className="btn-group">
            <button className="btn h-7" onClick={() => onExtract(entry)}>
              Extract
            </button>
            <button className="btn h-7" onClick={() => onReplace(entry)}>
              Replace
            </button>
            <button className="btn h-7" onClick={() => onRename(entry)}>
              Rename
            </button>
            <button className="btn btn-danger h-7" onClick={() => onDelete(entry)}>
              Delete
            </button>
          </div>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-[11.5px] text-muted">
          <span className="font-sans text-[12px]">{KIND_LABELS[kind]}</span>
          <span className="tnum">
            {formatBytes(entry.size)} · {entry.size.toLocaleString()} bytes · {sectors.toLocaleString()} sector{sectors === 1 ? '' : 's'}
          </span>
          {entry.source.kind === 'archive' ? (
            <span className="tnum">
              offset 0x{entry.source.offset.toString(16).toUpperCase()} · sector {(entry.source.offset / SECTOR).toLocaleString()}
            </span>
          ) : (
            <span className="font-sans text-[12px]">not written yet</span>
          )}
        </div>
      </div>
      {error ? (
        <div className="p-4 text-danger">Could not read the entry: {error}</div>
      ) : body ? (
        <div key={`body-${entry.id}`} className="anim-fade-in flex min-h-0 flex-1 flex-col">
          {body}
        </div>
      ) : (
        <div className="flex flex-col gap-2 p-4" aria-label="Loading">
          <div className="shimmer h-7 w-2/3" />
          <div className="shimmer h-40 w-full" />
          <div className="shimmer h-4 w-1/2" />
        </div>
      )}
    </div>
  )
}
