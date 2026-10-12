import type { ReactNode } from 'react'
import { FolderInput, ListTree } from 'lucide-react'
import type { ArchiveStats, ImgArchive, ImgEntry } from '../lib/img/archive'
import { SECTOR } from '../lib/img/format'
import { formatBytes } from '../lib/detect'
import { KIND_COLORS, KIND_LABELS, kindOf } from '../lib/kinds'
import type { IdeMap } from '../lib/ide'
import type { TxdIndex } from '../lib/txdIndex'
import { Meter } from './DffPreview'
import { Credits } from './Footer'

interface Props {
  archive: ImgArchive
  game: string
  stats: ArchiveStats
  entry: ImgEntry | null
  ideMap: IdeMap
  txdIndex: TxdIndex | null
  indexing: { done: number; total: number } | null
  onLoadIde: () => void
  onBuildIndex: () => void
}

const STATUS: Record<ImgEntry['status'], string> = {
  original: 'unchanged',
  added: 'new',
  replaced: 'replaced',
  renamed: 'renamed',
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-line px-5 py-4">
      <h3 className="label mb-3">{title}</h3>
      {children}
    </section>
  )
}

function Row({ label, value, tone }: { label: string; value: ReactNode; tone?: 'accent' | 'muted' }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-[3px]">
      <dt className="shrink-0 text-[12.5px] text-muted">{label}</dt>
      <dd
        className={`tnum min-w-0 truncate text-right font-mono text-[12px] ${tone === 'accent' ? 'text-accent-fg' : tone === 'muted' ? 'text-muted' : ''}`}
      >
        {value}
      </dd>
    </div>
  )
}

/** The right rail: the selected entry's numbers, the archive's numbers and how models find their textures. */
export function Details({ archive, game, stats, entry, ideMap, txdIndex, indexing, onLoadIde, onBuildIndex }: Props) {
  const position = entry ? archive.entries.findIndex((e) => e.id === entry.id) : -1
  const kind = entry ? kindOf(entry.name) : null
  const changed = archive.entries.reduce((n, e) => n + (e.status === 'original' ? 0 : 1), 0)

  return (
    <aside className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain border-l border-line bg-panel" aria-label="Details">
      <Section title="Entry">
        {entry && kind ? (
          <dl key={entry.id} className="anim-fade-in">
            <Row
              label="Type"
              value={
                <span className="inline-flex items-center gap-1.5 font-sans text-[12.5px]">
                  <span className="swatch" style={{ background: KIND_COLORS[kind] }} aria-hidden />
                  {KIND_LABELS[kind]}
                </span>
              }
            />
            <Row label="Size" value={formatBytes(entry.size)} />
            <Row label="Bytes" value={entry.size.toLocaleString()} />
            <Row label="Sectors" value={Math.ceil(entry.size / SECTOR).toLocaleString()} />
            {entry.source.kind === 'archive' ? (
              <>
                <Row label="Offset" value={`0x${entry.source.offset.toString(16).toUpperCase()}`} />
                <Row label="First sector" value={(entry.source.offset / SECTOR).toLocaleString()} />
              </>
            ) : (
              <Row label="Offset" value="on next save" tone="accent" />
            )}
            <Row label="Position" value={`${(position + 1).toLocaleString()} of ${archive.entries.length.toLocaleString()}`} />
            <Row label="Status" value={STATUS[entry.status]} tone={entry.status === 'original' ? 'muted' : 'accent'} />
            {entry.originalName && entry.originalName !== entry.name && <Row label="Was" value={entry.originalName} tone="muted" />}
          </dl>
        ) : (
          <p className="text-[12.5px] text-muted">Nothing selected.</p>
        )}
      </Section>

      <Section title="Archive">
        <dl>
          <Row label="File" value={archive.name} />
          <Row label="Format" value={`IMG v${archive.version}`} />
          <Row label="Game" value={game} />
          <Row label="Entries" value={archive.entries.length.toLocaleString()} />
          <Row label="On disk" value={formatBytes(archive.imgSize)} />
          <Row label="After saving" value={formatBytes(stats.rebuiltSize)} />
          {stats.delta !== 0 && (
            <Row
              label={stats.delta > 0 ? 'Reclaimed' : 'Grows by'}
              value={formatBytes(Math.abs(stats.delta))}
              tone="muted"
            />
          )}
          <Row
            label="Unsaved"
            value={stats.modified ? (changed ? `${changed.toLocaleString()} entr${changed === 1 ? 'y' : 'ies'}` : 'deletions') : 'none'}
            tone={stats.modified ? 'accent' : 'muted'}
          />
        </dl>
      </Section>

      <Section title="Texture lookup">
        <p className="text-[12.5px] leading-relaxed text-pretty text-muted">
          {ideMap.size
            ? `${ideMap.size.toLocaleString()} models are tied to a .txd by your .ide files.`
            : 'Models find their .txd by name. The game’s .ide files tie the rest to theirs.'}
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <button className="btn btn-sm justify-start" onClick={onLoadIde}>
            <FolderInput size={14} strokeWidth={1.75} aria-hidden />
            Load .ide files
          </button>
          {indexing ? (
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="tnum text-[12px] text-muted">
                Indexing textures, {indexing.done.toLocaleString()} of {indexing.total.toLocaleString()}
              </span>
              <Meter value={indexing.done / Math.max(1, indexing.total)} className="w-full" />
            </div>
          ) : txdIndex ? (
            <p className="tnum text-[12px] text-muted">
              Index ready: {txdIndex.textureCount.toLocaleString()} textures in {txdIndex.txdCount.toLocaleString()} dictionaries.
            </p>
          ) : (
            <button className="btn btn-sm justify-start" onClick={onBuildIndex} title="Reads the texture names inside every .txd so models can find theirs">
              <ListTree size={14} strokeWidth={1.75} aria-hidden />
              Index texture names
            </button>
          )}
        </div>
      </Section>

      <span className="grow" />
      <div className="flex flex-col gap-2 px-5 py-4">
        <Credits compact />
        <p className="text-[11.5px] text-faint">Not affiliated with Rockstar Games.</p>
      </div>
    </aside>
  )
}
