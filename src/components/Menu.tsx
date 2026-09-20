import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface MenuItem {
  label: string
  hint?: string
  shortcut?: string
  disabled?: boolean
  onSelect: () => void
}

/** A square dropdown attached to a button. */
export function Menu({ button, items, primary }: { button: ReactNode; items: MenuItem[]; primary?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        className={`btn ${primary ? 'btn-primary' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {button}
        <span className="text-[9px] opacity-70" aria-hidden>
          ▼
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="anim-scale-in absolute top-full right-0 z-30 mt-1 w-72 border border-line-strong bg-panel py-1"
        >
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              disabled={item.disabled}
              className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-selection disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              onClick={() => {
                setOpen(false)
                item.onSelect()
              }}
            >
              <span className="flex w-full items-center gap-2 text-[12.5px] font-medium">
                {item.label}
                <span className="grow" />
                {item.shortcut && <span className="kbd">{item.shortcut}</span>}
              </span>
              {item.hint && <span className="text-[11.5px] text-muted">{item.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
