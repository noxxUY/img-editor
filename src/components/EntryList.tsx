import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { ArrowDown, ArrowUp, SearchX } from 'lucide-react'
import type { ImgEntry } from '../lib/img/archive'
import { SECTOR } from '../lib/img/format'
import { formatBytes } from '../lib/detect'
import { KIND_COLORS, kindOf } from '../lib/kinds'
import type { SortState } from '../lib/ops'

const ROW = 30
const OVERSCAN = 12
const SORTS: [SortState['key'], string][] = [
  ['order', 'Archive order'],
  ['name', 'Name'],
  ['size', 'Size'],
  ['status', 'Changes'],
]

interface Props {
  entries: ImgEntry[]
  selected: Set<number>
  activeId: number | null
  onSelectionChange: (selected: Set<number>, active: number | null) => void
  sort: SortState
  onSort: (sort: SortState) => void
  onDelete: () => void
  onRename: (entry: ImgEntry) => void
  onOpen: (entry: ImgEntry) => void
}

const STATUS_TEXT: Record<ImgEntry['status'], string> = {
  original: '',
  added: 'new',
  replaced: 'replaced',
  renamed: 'renamed',
}

export function EntryList({
  entries,
  selected,
  activeId,
  onSelectionChange,
  sort,
  onSort,
  onDelete,
  onRename,
  onOpen,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const anchor = useRef<number>(-1)
  const [scrollTop, setScrollTop] = useState(0)
  const [height, setHeight] = useState(600)
  // rows rendered right after the list appears slide in one after another
  const mountedAt = useRef(performance.now())

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setHeight(el.clientHeight))
    ro.observe(el)
    setHeight(el.clientHeight)
    return () => ro.disconnect()
  }, [])

  const activeIndex = activeId === null ? -1 : entries.findIndex((e) => e.id === activeId)

  const selectIndex = useCallback(
    (index: number, mode: 'single' | 'toggle' | 'range') => {
      const entry = entries[index]
      if (!entry) return
      let next: Set<number>
      if (mode === 'toggle') {
        next = new Set(selected)
        if (next.has(entry.id)) next.delete(entry.id)
        else next.add(entry.id)
        anchor.current = index
      } else if (mode === 'range' && anchor.current >= 0) {
        const from = Math.min(anchor.current, index)
        const to = Math.max(anchor.current, index)
        next = new Set<number>()
        for (let i = from; i <= to; i++) next.add(entries[i].id)
      } else {
        next = new Set([entry.id])
        anchor.current = index
      }
      onSelectionChange(next, entry.id)
    },
    [entries, selected, onSelectionChange],
  )

  const scrollTo = (index: number) => {
    const el = scrollRef.current
    if (!el) return
    const top = index * ROW
    if (top < el.scrollTop) el.scrollTop = top
    else if (top + ROW > el.scrollTop + el.clientHeight) el.scrollTop = top + ROW - el.clientHeight
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (entries.length === 0) return
    const page = Math.max(1, Math.floor(height / ROW) - 1)
    let target = -1
    switch (e.key) {
      case 'ArrowDown':
        target = Math.min(entries.length - 1, activeIndex + 1)
        break
      case 'ArrowUp':
        target = Math.max(0, activeIndex - 1)
        break
      case 'PageDown':
        target = Math.min(entries.length - 1, activeIndex + page)
        break
      case 'PageUp':
        target = Math.max(0, activeIndex - page)
        break
      case 'Home':
        target = 0
        break
      case 'End':
        target = entries.length - 1
        break
      case 'Delete':
        e.preventDefault()
        onDelete()
        return
      case 'F2':
        e.preventDefault()
        if (activeIndex >= 0) onRename(entries[activeIndex])
        return
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0) onOpen(entries[activeIndex])
        return
      case 'a':
      case 'A':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          onSelectionChange(new Set(entries.map((x) => x.id)), activeId)
        }
        return
      default:
        return
    }
    e.preventDefault()
    if (target < 0) target = 0
    selectIndex(target, e.shiftKey ? 'range' : 'single')
    scrollTo(target)
  }

  const onRowClick = (e: MouseEvent, index: number) => {
    if (e.shiftKey) selectIndex(index, 'range')
    else if (e.ctrlKey || e.metaKey) selectIndex(index, 'toggle')
    else selectIndex(index, 'single')
  }

  const first = Math.max(0, Math.floor(scrollTop / ROW) - OVERSCAN)
  const last = Math.min(entries.length, Math.ceil((scrollTop + height) / ROW) + OVERSCAN)
  const rows = entries.slice(first, last)
  const staggered = performance.now() - mountedAt.current < 600

  const allSelected = entries.length > 0 && entries.every((e) => selected.has(e.id))
  const someSelected = !allSelected && entries.some((e) => selected.has(e.id))

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-9 shrink-0 items-center gap-2.5 border-b border-line px-3">
        <input
          type="checkbox"
          className="check"
          aria-label="Select all shown"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected
          }}
          onChange={() => onSelectionChange(allSelected ? new Set() : new Set(entries.map((e) => e.id)), activeId)}
        />
        <span className="tnum flex-1 text-[12px] text-muted">
          {entries.length.toLocaleString()} {entries.length === 1 ? 'entry' : 'entries'}
        </span>
        <label className="flex items-center gap-1.5 text-[12px] text-muted">
          <span className="sr-only sm:not-sr-only">Sort</span>
          <select
            className="field h-6 cursor-pointer border-transparent bg-transparent px-1 text-[12px] font-medium text-text hover:border-line-strong"
            value={sort.key}
            onChange={(e) => onSort({ key: e.target.value as SortState['key'], dir: 1 })}
          >
            {SORTS.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          className="btn btn-ghost btn-icon btn-sm -mr-1.5 size-6"
          onClick={() => onSort({ ...sort, dir: (sort.dir * -1) as 1 | -1 })}
          aria-label={sort.dir === 1 ? 'Ascending, switch to descending' : 'Descending, switch to ascending'}
          title={sort.dir === 1 ? 'Ascending' : 'Descending'}
        >
          {sort.dir === 1 ? <ArrowUp size={14} strokeWidth={1.75} /> : <ArrowDown size={14} strokeWidth={1.75} />}
        </button>
      </div>
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-auto overscroll-contain focus-visible:shadow-[inset_0_0_0_1px_var(--accent-2)] focus-visible:outline-none"
        tabIndex={0}
        role="listbox"
        aria-label="Entries"
        aria-multiselectable="true"
        aria-activedescendant={activeId !== null ? `entry-${activeId}` : undefined}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        onKeyDown={onKeyDown}
      >
        {entries.length === 0 ? (
          <div className="anim-fade-in flex flex-col items-center gap-2 px-6 py-12 text-center text-muted">
            <SearchX size={20} strokeWidth={1.5} className="text-faint" aria-hidden />
            <span>No entries match this filter.</span>
          </div>
        ) : (
          <div style={{ height: entries.length * ROW, position: 'relative' }}>
            {rows.map((entry, i) => {
              const index = first + i
              const isSelected = selected.has(entry.id)
              const isActive = entry.id === activeId
              const kind = kindOf(entry.name)
              return (
                <div
                  key={entry.id}
                  id={`entry-${entry.id}`}
                  role="option"
                  aria-selected={isSelected}
                  className={`group absolute right-0 left-0 flex cursor-default items-center gap-2.5 px-3 text-[13px] transition-colors duration-100 ${
                    isActive ? 'bg-selection text-text' : isSelected ? 'bg-selection/60' : 'hover:bg-panel-2/70'
                  } ${staggered ? 'anim-fade-in' : ''}`}
                  style={{ top: index * ROW, height: ROW, animationDelay: staggered ? `${Math.min(i, 20) * 12}ms` : undefined }}
                  onClick={(e) => onRowClick(e, index)}
                  onDoubleClick={() => onOpen(entry)}
                >
                  <input
                    type="checkbox"
                    className="check"
                    tabIndex={-1}
                    checked={isSelected}
                    aria-label={`Select ${entry.name}`}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => selectIndex(index, 'toggle')}
                  />
                  <span className="swatch" style={{ background: KIND_COLORS[kind] }} aria-hidden />
                  <span
                    className={`min-w-0 flex-1 truncate font-mono text-[12.5px] ${isActive ? 'font-medium' : isSelected ? '' : 'text-text/90'}`}
                    title={entry.name}
                  >
                    {entry.name}
                  </span>
                  {entry.status !== 'original' && (
                    <span className="shrink-0 font-mono text-[10.5px] font-medium text-accent-fg">{STATUS_TEXT[entry.status]}</span>
                  )}
                  <span
                    className="tnum w-[62px] shrink-0 text-right font-mono text-[11.5px] text-muted"
                    title={`${Math.ceil(entry.size / SECTOR)} sectors, #${index + 1} in this view`}
                  >
                    {formatBytes(entry.size)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
