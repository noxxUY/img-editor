import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import type { ImgEntry } from '../lib/img/archive'
import { SECTOR } from '../lib/img/format'
import { formatBytes } from '../lib/detect'
import { KIND_COLORS, kindOf } from '../lib/kinds'
import type { SortState } from '../lib/ops'

const ROW = 28
const OVERSCAN = 12
const GRID = 'grid-cols-[32px_minmax(0,1fr)_52px_84px_72px]'

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

  const header = (key: SortState['key'], label: string, className = '') => {
    const on = sort.key === key
    return (
      <button
        className={`flex h-full items-center gap-1 text-left text-[11.5px] font-semibold transition-colors hover:text-text ${on ? 'text-text' : 'text-muted'} ${className}`}
        onClick={() => onSort({ key, dir: on ? ((sort.dir * -1) as 1 | -1) : 1 })}
      >
        {label}
        <span className={`text-[9px] transition-opacity ${on ? 'opacity-100' : 'opacity-0'}`} aria-hidden>
          {sort.dir === 1 ? '▲' : '▼'}
        </span>
      </button>
    )
  }

  const allSelected = entries.length > 0 && entries.every((e) => selected.has(e.id))

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={`grid h-8 shrink-0 ${GRID} items-center border-b border-line bg-panel px-2`}>
        <input
          type="checkbox"
          aria-label="Select all visible"
          checked={allSelected}
          onChange={() =>
            onSelectionChange(allSelected ? new Set() : new Set(entries.map((e) => e.id)), activeId)
          }
        />
        {header('name', 'Name')}
        {header('order', 'Order')}
        {header('size', 'Size', 'justify-end')}
        {header('status', 'Changes', 'justify-end')}
      </div>
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-auto bg-bg outline-none"
        tabIndex={0}
        role="listbox"
        aria-multiselectable="true"
        aria-activedescendant={activeId !== null ? `entry-${activeId}` : undefined}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        onKeyDown={onKeyDown}
      >
        {entries.length === 0 ? (
          <div className="p-6 text-center text-muted">No entries match.</div>
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
                  className={`row absolute right-0 left-0 grid ${GRID} cursor-default items-center border-b border-line/70 px-2 text-[12.5px] transition-colors duration-100 ${
                    isSelected ? 'bg-selection' : 'hover:bg-panel-2'
                  } ${isActive ? 'shadow-[inset_2px_0_0_var(--accent)]' : ''} ${staggered ? 'anim-fade-up' : ''}`}
                  style={{ top: index * ROW, height: ROW, animationDelay: staggered ? `${Math.min(i, 24) * 14}ms` : undefined }}
                  onClick={(e) => onRowClick(e, index)}
                  onDoubleClick={() => onOpen(entry)}
                >
                  <input
                    type="checkbox"
                    tabIndex={-1}
                    checked={isSelected}
                    aria-label={`Select ${entry.name}`}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => selectIndex(index, 'toggle')}
                  />
                  <span className="flex min-w-0 items-center gap-2 font-mono">
                    <span className="inline-block size-2 shrink-0" style={{ background: KIND_COLORS[kind] }} aria-hidden />
                    <span className={`truncate ${isActive ? 'font-medium' : ''}`} title={entry.name}>
                      {entry.name}
                    </span>
                  </span>
                  <span className="tnum font-mono text-[11px] text-faint">{index + 1}</span>
                  <span className="tnum text-right font-mono text-[11.5px] text-muted" title={`${Math.ceil(entry.size / SECTOR)} sectors`}>
                    {formatBytes(entry.size)}
                  </span>
                  <span className="text-right text-[11.5px] font-medium text-accent">{STATUS_TEXT[entry.status]}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
